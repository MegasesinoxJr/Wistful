#!/bin/bash

# Esperar a que la base de datos esté disponible
echo "Esperando a que la base de datos este disponible..."
while ! nc -z db 3306; do
  sleep 1
done

echo "Base de datos lista. Aplicando migraciones..."
python manage.py migrate

echo "Creando superusuario si no existe..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='testadmin').exists():
    User.objects.create_superuser('testadmin', 'testadmin@testadmin.com', 'testadmin')
EOF

echo "Iniciando servidor..."
exec uvicorn wistful.asgi:application --host 0.0.0.0 --port 5100 --reload
