from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/combat/', consumers.CombateConsumer.as_asgi()),
]