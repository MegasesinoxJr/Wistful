from channels.generic.websocket import AsyncWebsocketConsumer
import json
import random

active_queue = []

class CombateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.user_id = self.scope["user"].id

        # Añadir a la cola si no está
        if self.user_id not in active_queue:
            active_queue.append(self.user_id)

        # Emparejamiento
        if len(active_queue) >= 2:
            user_1 = active_queue.pop(0)
            user_2 = active_queue.pop(0)
            await self.channel_layer.group_add(f"combate_{user_1}_{user_2}", self.channel_name)
            await self.send(json.dumps({"match": True, "vs": [user_1, user_2]}))

    async def disconnect(self, close_code):
        if self.user_id in active_queue:
            active_queue.remove(self.user_id)

    async def receive(self, text_data):
        data = json.loads(text_data)
        # aquí puedes manejar turnos, ataque, daño, etc.