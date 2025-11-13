#!/usr/bin/env bash
set -euo pipefail

EXPECTED="${EXPECTED_OAUTH_REDIRECTS:-http://localhost:5173/auth/callback/google,https://productifyai.vercel.app/auth/callback/google}"
ACTUAL="${OAUTH_REDIRECT_URIS:-$EXPECTED}"

normalize() {
  echo "$1" | tr ',' '\n' | sed 's~/*$~~' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sort -u
}

EXPECTED_NORMALIZED="$(normalize "${EXPECTED}")"
ACTUAL_NORMALIZED="$(normalize "${ACTUAL}")"

if [[ "${EXPECTED_NORMALIZED}" == "${ACTUAL_NORMALIZED}" ]]; then
  echo "✅ OAuth redirect URIs match expected list:"
  echo "${EXPECTED_NORMALIZED}"
  exit 0
else
  echo "❌ OAuth redirect URIs mismatch!"
  echo "Expected:"
  echo "${EXPECTED_NORMALIZED}"
  echo "Actual:"
  echo "${ACTUAL_NORMALIZED}"
  exit 1
fi


