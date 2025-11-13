#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${API_BASE_URL:-https://productifyai-api.onrender.com}"
ENDPOINT="${BASE_URL%/}/healthz"

echo "🔍 Checking API health at ${ENDPOINT}"

if RESPONSE=$(curl --fail --silent --show-error --max-time 20 "${ENDPOINT}"); then
  echo "✅ Health check passed"
  echo "${RESPONSE}"
else
  STATUS=$?
  echo "❌ Health check failed with status ${STATUS}"
  exit "${STATUS}"
fi


