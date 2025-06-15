# 🐋 Wistful – Guía de Instalación y Despliegue

Esta guía explica cómo poner en marcha la aplicación Wistful, tanto en local (modo desarrollo) como en un servidor en producción. El proyecto está dividido en frontend (React), backend (Django + ASGI), base de datos (MariaDB), Redis, y Stripe CLI para la gestión de eventos.

---

## 🚧 Requisitos

Antes de comenzar, asegúrate de tener instalado:

- Docker
- Docker Compose
- Git (opcional, pero recomendable)

---

## ▶️ Despliegue en Local (Modo Desarrollo)

### 1. Clonar el repositorio

```bash
git clone https://github.com/megasesinoxjr/wistful.git
```

### 2. Copia los archivos `.env.example` y rellenalos, quita el sufijo ".example"

### 3. Levantar los servicios, linea a linea

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker exec -it wistful-backend-1 python3 manage.py migrate 
docker exec -it wistful-backend-1 python3 manage.py collectstatic
docker exec -i wistful-backend-1 bash -c 'DJANGO_SUPERUSER_USERNAME=admin DJANGO_SUPERUSER_EMAIL=admin@wistful.my DJANGO_SUPERUSER_PASSWORD=adminpassword python manage.py createsuperuser --noinput'
docker compose -f docker-compose.dev.yml down 
docker compose -f docker-compose.dev.yml up -d --build

```
Recuerda en los .env, cambiar quitar el "example" y cambiar las direcciones por las locales de los .env
Debug esta a False por defecto, ponlo a True, o el websocket no funcionará.

Esto ejecuta:

- Backend Django con recarga automática (`runserver`)
- Frontend React con hot reload (Vite)
- Base de datos MariaDB
- Stripe CLI
- Redis
- WebSocket

### 4. Acceso

- Frontend: [http://localhost:5173]
- Backend: [http://localhost:8000]

---

## 🚀 Despliegue en Producción

### Requisitos en el servidor (VPS)

- Docker y Docker Compose instalados
- Dominio configurado (ej. desde Namecheap)
- NGINX instalado (para redireccionar tráfico)
- Certificado SSL (Let’s Encrypt o similar, opcional pero recomendado)

### 1. Clonar el repositorio

```bash
git clone https://github.com/megasesinoxjr/wistful.git Wistful
cd Wistful
```

### 2. Copia los archivos `.env.example` y rellenalos, quita el sufijo ".example"


### 3. Configuración de NGINX
Debes crear los ficheros de los certificados SSL (/etc/nginx/ssl/) y el fichero de configuracion(/etc/nginx/sites-available/) llamado wistful.


### 4. Levantar los servicios

```bash
docker compose -f compose.yml up -d --build
ln -s /etc/nginx/sites-available/wistful /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
docker exec -i wistful-backend-1 bash -c 'python3 manage.py makemigrations'
docker exec -i wistful-backend-1 bash -c 'python3 manage.py migrate'
docker exec -i wistful-backend-1 bash -c 'python3 manage.py collectstatic --noinput'
mkdir -p /srv/wistful/DJANGO_media/perfil/ && wget --user-agent='Mozilla/5.0' -O /srv/wistful/DJANGO_media/perfil/default.jpg https://raw.githubusercontent.com/MegasesinoxJr/Wistful/refs/heads/main/recursos/Oh7J7GP.jpeg
docker exec -i wistful-backend-1 bash -c 'DJANGO_SUPERUSER_USERNAME=admin DJANGO_SUPERUSER_EMAIL=admin@wistful.my DJANGO_SUPERUSER_PASSWORD=adminpassword python manage.py createsuperuser --noinput'

```

---


## 🧪 Comprobaciones

- Verifica que puedes acceder al dominio
- Confirma que Stripe CLI está reenviando correctamente a `/api/webhook/`
- Consulta logs si algo falla:

```bash
docker compose logs -f
```

---

## 🧹 Apagar servicios

```bash
docker compose down
```

Para detener y borrar contenedores y volúmenes asociados:

```bash
docker compose down -v --rmi all --remove-orphans
```

---

## 📂 Estructura del Proyecto

- **frontend/** – React + Vite
- **backend/** – Django (ASGI)
- **docker-compose.dev.yml** – entorno de desarrollo
- **compose.yml** – entorno de producción

---

## ✨ Notas

- Stripe CLI requiere tener la clave secreta en `.env`.
- El build de producción compila el frontend y lo sirve con NGINX.
- Se utilizan volúmenes para datos persistentes de MariaDB y archivos estáticos/media de Django.

---
