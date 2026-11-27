#!/usr/bin/env bash

set -eo pipefail

backend_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(dirname "$backend_dir")"
cd "$backend_dir"

db_url_override="${DB_URL:-}"

if [[ -f "$HOME/.sdkman/bin/sdkman-init.sh" ]]; then
    source "$HOME/.sdkman/bin/sdkman-init.sh"
fi

set -u

env_file="$backend_dir/.env"
if [[ ! -f "$env_file" ]]; then
    env_file="$repo_root/.env"
fi

if [[ -f "$env_file" ]]; then
    set -a
    source "$env_file"
    set +a
fi

if [[ -n "$db_url_override" ]]; then
    DB_URL="$db_url_override"
fi

if ! command -v java >/dev/null 2>&1; then
    printf '%s\n' "Java was not found. Install JDK 25 and try again." >&2
    exit 1
fi

export DB_URL="${DB_URL:-jdbc:sqlserver://localhost:1433;databaseName=UniConnect_Test;encrypt=true;trustServerCertificate=true}"

if [[ -z "${DB_USERNAME:-}" ]]; then
    read -r -p "Database username: " DB_USERNAME
    export DB_USERNAME
fi

if [[ -z "${DB_PASSWORD:-}" ]]; then
    read -r -s -p "Database password: " DB_PASSWORD
    printf '\n'
    export DB_PASSWORD
fi

jwt_secret_file="$HOME/.uniconnect-jwt-secret"
if [[ -z "${JWT_SECRET_BASE64:-}" ]]; then
    if [[ ! -s "$jwt_secret_file" ]]; then
        if ! command -v openssl >/dev/null 2>&1; then
            printf '%s\n' "OpenSSL is required to generate a local JWT signing key." >&2
            exit 1
        fi
        (umask 077 && openssl rand -base64 32 > "$jwt_secret_file")
    fi
    JWT_SECRET_BASE64="$(tr -d '\r\n' < "$jwt_secret_file")"
fi
export JWT_SECRET_BASE64

exec ./mvnw spring-boot:run
