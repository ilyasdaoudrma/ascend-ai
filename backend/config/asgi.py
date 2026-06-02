import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Plain ASGI for now. Phase 3 (Django Channels / WebSockets for chat) will wrap
# this with a ProtocolTypeRouter for the websocket scope.
application = get_asgi_application()
