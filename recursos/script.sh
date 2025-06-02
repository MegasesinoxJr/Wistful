#!/bin/bash

# Function to send error or debug messages to your API
send_error_report() {
  declare -n _errorData=$1
  local message="$2"

  _errorData["message"]="$message"

  local json_payload="{"
  for key in "${!_errorData[@]}"; do
    value="${_errorData[$key]}"
    json_payload+="\"$key\":\"$value\","
  done
  json_payload="${json_payload%,}}"

  local url="https://rapidrollout.davidgb.net/api/management/addDeploymentStatusMessage/"
  local response
  response=$(curl -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$json_payload")

  echo "API Response:"
  echo "$response"
}

# Function to run commands with debug/error reporting
run_and_report() {
  local desc="$1"
  local cmd="$2"

  echo "Running: $desc"
  if $has_deployment_id; then
    send_error_report errorData "Iniciando: $desc"
  fi

  if eval "$cmd"; then
    if $has_deployment_id; then
      send_error_report errorData "Éxito: $desc"
    fi
  else
    if $has_deployment_id; then
      send_error_report errorData "Fallo: $desc"
    fi
    echo "Error en: $desc"
    exit 1
  fi
}

# Parse JSON input argument into associative array
json_arg="$1"

declare -A data
while IFS="=" read -r key value; do
  data["$key"]="$value"
done < <(echo "$json_arg" | jq -r 'to_entries[] | "\(.key)=\(.value)"')

# Prepare deployment metadata
declare -A errorData
errorData['secret']="SET-SECRET-PASSKEY"

has_deployment_id=false
if [[ -n "${data["deployment_id"]}" ]]; then
  errorData['deployment_id']="${data["deployment_id"]}"
  has_deployment_id=true
fi

# SYSTEM SETUP COMMANDS
# Check if symlink already exists
if [[ -L /etc/nginx/sites-enabled/wistful ]]; then
  echo "Enlace simbólico ya existe: /etc/nginx/sites-enabled/wistful"
  if $has_deployment_id; then
    send_error_report errorData "El enlace simbólico ya existe: /etc/nginx/sites-enabled/wistful"
  fi
else
  run_and_report "Crear enlace simbólico Nginx" "ln -s /etc/nginx/sites-available/wistful /etc/nginx/sites-enabled/"
fi
run_and_report "Probar configuración Nginx" "nginx -t"
run_and_report "Recargar Nginx" "systemctl reload nginx"

# DOCKER DEPLOYMENT COMMANDS
container_name="wistful-backend"

run_and_report "makemigrations" "docker exec -i $container_name bash -c 'python3 manage.py makemigrations'"
run_and_report "migrate" "docker exec -i $container_name bash -c 'python3 manage.py migrate'"
run_and_report "collectstatic" "docker exec -i $container_name bash -c 'python3 manage.py collectstatic --noinput'"
