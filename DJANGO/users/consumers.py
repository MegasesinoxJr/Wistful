import os
import json
import random
import re

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import redis.asyncio as redis


# Configuración del cliente Redis apuntando al host "redis"

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB   = int(os.getenv("REDIS_DB", 0))

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True,   
)


# Utilidades para nombres de sala y limpieza de cadenas

def clean_group_name(name: str) -> str:
    return re.sub(r'[^a-zA-Z0-9\-\_\.]', '_', name)


class PVPConsumer(AsyncJsonWebsocketConsumer):
    combatiente = None

    async def connect(self):
        # aceptamos el WebSocket y añadimos este channel_name a Redis para marcarlo como "activo".
        await self.accept()
        await redis_client.sadd("active_channels", self.channel_name)

    async def disconnect(self, close_code):
        # si estaba en la cola de espera, lo quitamos
        try:
            await redis_client.lrem("waiting", 0, self.channel_name)
        except Exception:
            pass

        # si estaba en una batalla, limpiamos los hashes para ambos combatientes
        battle_key = f"battle:{self.channel_name}"
        battle_data = await redis_client.hgetall(battle_key)
        if battle_data:
            opponent_name = battle_data.get("opponent")
            if opponent_name:
                await redis_client.delete(f"battle:{opponent_name}")
            await redis_client.delete(battle_key)

        # lo quitamos del conjunto de canales activos
        await redis_client.srem("active_channels", self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        # Matchmaking #

        if action == "matchmake":
            # guardamos la info del combatiente en Redis como string JSON
            self.combatiente = content["userCombatiente"]
            await redis_client.set(
                f"combatiente:{self.channel_name}",
                json.dumps(self.combatiente)
            )

            # Si no estaba ya en la lista de espera, lo añadimos al final
            pos = await redis_client.lpos("waiting", self.channel_name)
            if pos is None:
                await redis_client.rpush("waiting", self.channel_name)

            # Si hay  2 jugadores esperando, matchmaking
            queue_length = await redis_client.llen("waiting")
            if queue_length >= 2:
                # Sacamos dos nombres de canal
                p1_name = await redis_client.lpop("waiting")
                p2_name = await redis_client.lpop("waiting")
                if not p1_name or not p2_name:
                    return  

                # Comprobamos en Redis si siguen activos
                p1_activo = await redis_client.sismember("active_channels", p1_name)
                p2_activo = await redis_client.sismember("active_channels", p2_name)

                if not p1_activo or not p2_activo:
                    # Si alguno ya no está conectado, reingresamos el otro si aún está activo
                    if p1_activo:
                        await redis_client.rpush("waiting", p1_name)
                    if p2_activo:
                        await redis_client.rpush("waiting", p2_name)
                    return

                # Ambos siguen activos: armamos la sala y guardamos en Redis
                room = f"battle_{clean_group_name(p1_name)}_{clean_group_name(p2_name)}"

                # Creamos el hash en Redis para cada jugador
                await redis_client.hset(
                    f"battle:{p1_name}",
                    mapping={
                        "opponent": p2_name,
                        "room":     room,
                        "turn":     p1_name,
                    },
                )
                await redis_client.hset(
                    f"battle:{p2_name}",
                    mapping={
                        "opponent": p1_name,
                        "room":     room,
                        "turn":     p1_name,
                    },
                )

                # notificamos a cada cliente (usando channel_layer.send)enviamos evento "start"
                # al cliente p1 le mandamos: {"event": "start", "opponent": <datos JSON de p2>}
                # al cliente p2 le mandamos: {"event": "start", "opponent": <datos JSON de p1>}
                raw_p1_combatiente = await redis_client.get(f"combatiente:{p1_name}")
                raw_p2_combatiente = await redis_client.get(f"combatiente:{p2_name}")
                p1_combatiente = json.loads(raw_p1_combatiente) if raw_p1_combatiente else {}
                p2_combatiente = json.loads(raw_p2_combatiente) if raw_p2_combatiente else {}

                # enviamos ambos mensajes de inicio
                await self.channel_layer.send(p1_name, {
                    "type":    "pvp.send_json",
                    "content": {"event": "start", "opponent": p2_combatiente},
                })
                await self.channel_layer.send(p2_name, {
                    "type":    "pvp.send_json",
                    "content": {"event": "start", "opponent": p1_combatiente},
                })

                # finalmente, mandamos el estado inicial (turno de p1)
                await self._enviar_estado(p1_name, p2_name, canal_con_turno=p1_name)

        # usar habilidad ("use_skill")

        elif action == "use_skill": 
            skill = content.get("skill")
            battle_key = f"battle:{self.channel_name}"
            battle_data = await redis_client.hgetall(battle_key)
            if not battle_data:
                await self.send_json({"event": "error", "message": "No estás en combate."})
                return

            turn_channel = battle_data.get("turn")
            if turn_channel != self.channel_name:
                await self.send_json({"event": "error", "message": "No es tu turno aún."})
                return

            # identificamos atacante y defensor
            attacker_name = self.channel_name
            defender_name = battle_data.get("opponent")

            # comprobamos que el defensor siga conectado
            defensor_activo = await redis_client.sismember("active_channels", defender_name)
            if not defensor_activo:
                await self.send_json({"event": "error", "message": "Oponente desconectado."})
                return

            # recuperamos datos de combatiente desde Redis
            raw_attacker = await redis_client.get(f"combatiente:{attacker_name}")
            raw_defender = await redis_client.get(f"combatiente:{defender_name}")
            attacker = json.loads(raw_attacker) if raw_attacker else {}
            defender = json.loads(raw_defender) if raw_defender else {}

            nombre = attacker.get("nombre", "Jugador")
            text = f"{nombre} USÓ {skill}!"

            # enviamos mensaje de acción a ambos
            await self.channel_layer.send(attacker_name, {
                "type":    "pvp.send_json",
                "content": {"event": "message", "text": text},
            })
            await self.channel_layer.send(defender_name, {
                "type":    "pvp.send_json",
                "content": {"event": "message", "text": text},
            })

            # calculamos daño y actualizamos “salud” en el objeto defender
            damage = random.randint(10, 20)
            total_damage = damage + defender.get("damage", 0)
            nueva_salud = defender.get("salud", 0) - total_damage
            if nueva_salud < 0:
                nueva_salud = 0
            defender["salud"] = nueva_salud

            # guardamos el nuevo estado de salud en Redis
            await redis_client.set(f"combatiente:{defender_name}", json.dumps(defender))

            # cambio de turno en Redis 
            await redis_client.hset(f"battle:{attacker_name}", "turn", defender_name)
            await redis_client.hset(f"battle:{defender_name}", "turn", defender_name)

            # envio de estado actualizado (vidas y turno)
            await self._enviar_estado(attacker_name, defender_name, canal_con_turno=defender_name)

            # comprobamos si la batalla a terminado
            if defender["salud"] <= 0 or attacker.get("salud", 0) <= 0:
                xp_gain = random.randint(50, 80)
                trophy_gain = random.randint(1, 3)

                # actualizamos en base de datos real solo para el atacante
                from .models import Combatiente as CombatienteModel
                db_c = await database_sync_to_async(CombatienteModel.objects.get)(
                    pk=attacker.get("id")
                )
                await database_sync_to_async(db_c.ganar_experiencia)(xp_gain)
                db_c.trofeos += trophy_gain
                await database_sync_to_async(db_c.save)()

                # enviamos evento end a ambos
                await self.channel_layer.send(attacker_name, {
                    "type":    "pvp.send_json",
                    "content": {"event": "end", "experiencia": xp_gain},
                })
                await self.channel_layer.send(defender_name, {
                    "type":    "pvp.send_json",
                    "content": {"event": "end", "experiencia": 0},
                })

                # limpiamos en redis: battle:<canal> y combatiente:<canal> para ambos
                await redis_client.delete(f"battle:{attacker_name}")
                await redis_client.delete(f"battle:{defender_name}")
                await redis_client.delete(f"combatiente:{attacker_name}")
                await redis_client.delete(f"combatiente:{defender_name}")

                # cerramos ambos websockets
                await self.channel_layer.send(attacker_name, {
                    "type": "pvp.close_socket"
                })
                await self.channel_layer.send(defender_name, {
                    "type": "pvp.close_socket"
                })


    #  metodo auxiliar para enviar el estado del turno a ambos

    async def _enviar_estado(self, p1_name: str, p2_name: str, canal_con_turno: str):
        """
        Envía a p1 y p2 un JSON con:
         - event = "turn"
         - turn = "combatiente" o "oponente"
         - vidaCombatiente = salud del propio
         - vidaOponente = salud del otro
        canal_con_turno es el channel_name que tiene el turno esta ronda.
        """
        # leemos los datos de cada combatiente desde Redis
        raw_p1 = await redis_client.get(f"combatiente:{p1_name}")
        raw_p2 = await redis_client.get(f"combatiente:{p2_name}")
        p1 = json.loads(raw_p1) if raw_p1 else {}
        p2 = json.loads(raw_p2) if raw_p2 else {}

        # decidimos el campo "turn" para cada uno
        turn_p1 = "combatiente" if canal_con_turno == p1_name else "oponente"
        turn_p2 = "combatiente" if canal_con_turno == p2_name else "oponente"

        # enviamos a p1
        await self.channel_layer.send(p1_name, {
            "type": "pvp.send_json",
            "content": {
                "event":           "turn",
                "turn":            turn_p1,
                "vidaCombatiente": p1.get("salud", 0),
                "vidaOponente":    p2.get("salud", 0),
            }
        })

        # enviamos a p2
        await self.channel_layer.send(p2_name, {
            "type": "pvp.send_json",
            "content": {
                "event":           "turn",
                "turn":            turn_p2,
                "vidaCombatiente": p2.get("salud", 0),
                "vidaOponente":    p1.get("salud", 0),
            }
        })


    #  handler que Channels invoca cuando enviamos "type": "pvp.send_json"

    async def pvp_send_json(self, event):
        """
        Channels invoca este método si hacemos:
          await channel_layer.send(<mi_canal>, {
              "type": "pvp.send_json",
              "content": {...}
          })
        """
        await self.send_json(event["content"])


    #  cerrar el socket cuando la batalla termina

    async def pvp_close_socket(self, event):
        await self.close()
