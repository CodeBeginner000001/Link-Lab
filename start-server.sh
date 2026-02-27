#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${ROOT_DIR}/redis-docker-compose.yml"
SERVER_DIR="${ROOT_DIR}/server"
REDIS_CONTAINER_NAME="redis_container"
REDIS_PORT="6379"
MONGO_PORT="27017"

log() {
  printf '[start-server] %s\n' "$*"
}

fail() {
  printf '[start-server] ERROR: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: ${cmd}"
}

detect_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=("docker" "compose")
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=("docker-compose")
    return
  fi

  fail "Docker Compose not found. Install Docker Compose (plugin or docker-compose binary)."
}

wait_for_redis() {
  local tries=30
  local i

  log "Waiting for Redis container health..."

  for ((i = 1; i <= tries; i++)); do
    if ! docker inspect "${REDIS_CONTAINER_NAME}" >/dev/null 2>&1; then
      sleep 1
      continue
    fi

    local status
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${REDIS_CONTAINER_NAME}" 2>/dev/null || true)"

    case "${status}" in
      healthy|running)
        log "Redis is ${status}."
        return 0
        ;;
      unhealthy)
        fail "Redis container is unhealthy."
        ;;
      *)
        log "Redis status: ${status:-unknown} (${i}/${tries})"
        ;;
    esac

    sleep 2
  done

  fail "Timed out waiting for Redis to become ready."
}

warn_if_mongo_missing() {
  if command -v nc >/dev/null 2>&1; then
    if nc -z localhost "${MONGO_PORT}" >/dev/null 2>&1; then
      log "MongoDB appears reachable on localhost:${MONGO_PORT}."
      return 0
    fi
  fi

  log "MongoDB was not detected on localhost:${MONGO_PORT}."
  log "The Go server calls MongoDB on startup and may keep retrying until MongoDB is available."
}

main() {
  require_cmd docker
  require_cmd go

  [[ -f "${COMPOSE_FILE}" ]] || fail "Compose file not found: ${COMPOSE_FILE}"
  [[ -d "${SERVER_DIR}" ]] || fail "Server directory not found: ${SERVER_DIR}"

  detect_compose_cmd

  log "Starting Redis with ${COMPOSE_FILE}"
  "${COMPOSE_CMD[@]}" -f "${COMPOSE_FILE}" up -d

  wait_for_redis
  warn_if_mongo_missing

  log "Installing Go dependencies"
  (
    cd "${SERVER_DIR}"
    go mod download
  )

  log "Starting Go server on :4000"
  cd "${SERVER_DIR}"
  exec go run .
}

main "$@"
