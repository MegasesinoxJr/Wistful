import json
import random
import re
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async


waiting = []
active_battles = {}

def clean_group_name(name):
    return re.sub(r'[^a-zA-Z0-9-_\.]', '_', name)

class PVPConsumer(AsyncJsonWebsocketConsumer):
    combatiente = None

    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        if self in waiting:
            waiting.remove(self)
        if self.channel_name in active_battles:
            opponent = active_battles[self.channel_name]['opponent']
            del active_battles[self.channel_name]
            del active_battles[opponent.channel_name]

    async def receive_json(self, content):
        action = content.get('action')

        # 1ro matchmake (sin cambios)
        if action == 'matchmake':
            self.combatiente = content['userCombatiente']
            if self not in waiting:
                waiting.append(self)
            if len(waiting) >= 2:
                p1 = waiting.pop(0)
                p2 = waiting.pop(0)
                room = f"battle_{clean_group_name(p1.channel_name)}_{clean_group_name(p2.channel_name)}"
                await p1.channel_layer.group_add(room, p1.channel_name)
                await p2.channel_layer.group_add(room, p2.channel_name)

                # primer turno a p1
                active_battles[p1.channel_name] = {'opponent': p2, 'room': room, 'turn': p1}
                active_battles[p2.channel_name] = {'opponent': p1, 'room': room, 'turn': p1}

                await p1.send_json({"event": "start", "opponent": p2.combatiente})
                await p2.send_json({"event": "start", "opponent": p1.combatiente})
                await self.send_state(p1, p2, turn=p1)

        # 2do turno uso de habilidad en lugar de "attack"
        elif action == "use_skill":
            skill = content.get('skill')
            battle = active_battles.get(self.channel_name)
            if not battle:
                await self.send_json({"event": "error", "message": "No estás en combate."})
                return
            if battle['turn'] != self:
                await self.send_json({"event": "error", "message": "No es tu turno aún."})
                return

            attacker = self
            defender = battle['opponent']

            # enviar mensaje de habilidad
            print(attacker.combatiente)
            nombre = attacker.combatiente.get('nombre', 'Jugador')
            text = f"{nombre} USÓ {skill}!"
            print(text)
            await attacker.send_json({"event": "message", "text": text})
            await defender.send_json({"event": "message", "text": text})

            # calcular daño y restar salud
            damage = random.randint(10, 20) 
            print(defender.combatiente['damage'])
            print(damage)
            print(damage + defender.combatiente['damage'])
            defender.combatiente['salud'] -= damage + defender.combatiente['damage']
            if (defender.combatiente['salud'] <0):
                defender.combatiente['salud'] = 0

            # cambiar turno
            battle['turn'] = defender
            active_battles[attacker.channel_name]['turn'] = defender
            active_battles[defender.channel_name]['turn'] = defender

            # enviar estado actualizado
            await self.send_state(attacker, defender, turn=defender)

            # comprobar fin de combate
            if defender.combatiente['salud'] <= 0 or attacker.combatiente['salud'] <= 0:
                xp_gain = random.randint(50, 80)
                from .models import Combatiente
                db_c = await database_sync_to_async(Combatiente.objects.get)(pk=attacker.combatiente['id'])
                await database_sync_to_async(db_c.ganar_experiencia)(xp_gain)
                # sumar trofeos
                trophy_gain = random.randint(1, 3)
                db_c.trofeos += trophy_gain
                await database_sync_to_async(db_c.save)()
                # enviar resultados a los 2 usuarios
                await attacker.send_json({"event": "end", "experiencia": xp_gain})
                await defender.send_json({"event": "end", "experiencia": 0})
                del active_battles[attacker.channel_name]
                del active_battles[defender.channel_name]

                # cerrar conexiones websocket
                await attacker.close()
                await defender.close()

    async def send_state(self, p1, p2, turn):
        turn_p1 = "combatiente" if turn == p1 else "oponente"
        turn_p2 = "combatiente" if turn == p2 else "oponente"

        await p1.send_json({
            "event": "turn",
            "turn": turn_p1,
            "vidaCombatiente": p1.combatiente['salud'],
            "vidaOponente": p2.combatiente['salud']
        })
        await p2.send_json({
            "event": "turn",
            "turn": turn_p2,
            "vidaCombatiente": p2.combatiente['salud'],
            "vidaOponente": p1.combatiente['salud']
        })
