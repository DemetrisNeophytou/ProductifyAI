#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${API_BASE_URL:-https://productifyai-api.onrender.com}"
ORIGINS="${EXPECTED_FRONTEND_ORIGINS:-http://localhost:5173,https://productifyai.vercel.app}"
ENDPOINT="${BASE_URL%/}/healthz"

IFS=',' read -r -a ORIGIN_LIST <<< "${ORIGINS}"

for ORIGIN in "${ORIGIN_LIST[@]}"; do
  ORIGIN_TRIMMED="$(echo "${ORIGIN}" | xargs)"
  echo "🔐 Testing CORS preflight against ${ENDPOINT}"
  echo "    Origin: ${ORIGIN_TRIMMED}"

  RESPONSE_HEADERS="$(curl --silent --show-error --max-time 20 \
    -X OPTIONS "${ENDPOINT}" \
    -H "Origin: ${ORIGIN_TRIMMED}" \
    -H "Access-Control-Request-Method: GET" \
    -D - \
    -o /dev/null)"

  ALLOW_ORIGIN="$(echo "${RESPONSE_HEADERS}" | awk -F': ' '/[Aa]ccess-[Cc]ontrol-[Aa]llow-[Oo]rigin/ {print $2}' | tr -d '\r')"

  if [[ -z "${ALLOW_ORIGIN}" ]]; then
    echo "❌ CORS preflight failed: missing Access-Control-Allow-Origin header"
    exit 1
  fi

  if [[ "${ALLOW_ORIGIN}" == "${ORIGIN_TRIMMED}" || "${ALLOW_ORIGIN}" == "*" ]]; then
    echo "   ✅ Access-Control-Allow-Origin=${ALLOW_ORIGIN}"
  else
    echo "❌ Unexpected Access-Control-Allow-Origin value: ${ALLOW_ORIGIN}"
    exit 2
  fi
done

echo "✅ All origins passed CORS preflight checks"
exit 0


