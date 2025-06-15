import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from users import consumers  # Asegúrate de importar tus consumidores

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wistful.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/pvp/", consumers.PVPConsumer.as_asgi()),
        ])
    ),
})
