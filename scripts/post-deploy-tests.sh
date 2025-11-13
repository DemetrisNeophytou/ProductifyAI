#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${API_BASE_URL:-https://productifyai-api.onrender.com}"
ORIGIN="${EXPECTED_FRONTEND_ORIGIN:-https://productifyai.vercel.app}"

PASS=0
FAIL=0

run_test() {
  local name="$1"
  shift
  echo "▶️  ${name}"
  if "$@"; then
    echo "   ✅ Passed"
    PASS=$((PASS + 1))
  else
    local status=$?
    echo "   ❌ Failed (exit ${status})"
    FAIL=$((FAIL + 1))
  fi
}

run_test "GET /healthz" \
  curl --fail --silent --show-error --max-time 20 "${BASE_URL%/}/healthz" >/dev/null

run_test "GET /api/health" \
  curl --fail --silent --show-error --max-time 20 "${BASE_URL%/}/api/health" >/dev/null

run_test "GET /api/v2/ai/health" \
  curl --fail --silent --show-error --max-time 20 "${BASE_URL%/}/api/v2/ai/health" >/dev/null

run_test "HEAD /" \
  curl --fail --silent --show-error --max-time 20 --head "${BASE_URL%/}/" >/dev/null

run_test "Static asset check dist/public/index.html" \
  test -f "${SCRIPT_DIR}/../dist/public/index.html"

run_test "Server bundle check dist/server.js" \
  test -f "${SCRIPT_DIR}/../dist/server.js"

run_test "CORS preflight" \
  "${SCRIPT_DIR}/cors-test.sh"

run_test "Health script smoke test" \
  "${SCRIPT_DIR}/health-check.sh"

run_test "Secrets scan script presence" \
  test -f "${SCRIPT_DIR}/secrets-scan.mjs"

run_test "PDF export dry-run" bash -c '
  TEMP_TS="$(mktemp)"
  cat <<'"'"'TS'"'"' >"${TEMP_TS}"
import { generateBlocksPDF } from "../server/blocks-pdf-export";

const data = {
  projectTitle: "PDF Smoke Test",
  pages: [{
    id: "page-1",
    title: "Sample Page",
    blocks: [{
      id: "block-1",
      type: "paragraph",
      order: 1,
      content: { text: "This is a PDF smoke test." }
    }]
  }]
};

const run = async () => {
  const buffer = await generateBlocksPDF(data);
  if (!buffer || !(buffer instanceof Uint8Array)) {
    throw new Error("generateBlocksPDF did not return a Uint8Array");
  }
};

run();
TS
  npx --yes tsx "${TEMP_TS}"
  rm -f "${TEMP_TS}"
'

run_test "CORS_ORIGIN whitespace validation" bash -c '
  if [[ -n "${CORS_ORIGIN:-}" && "${CORS_ORIGIN}" =~ [[:space:]] ]]; then
    echo "CORS_ORIGIN contains whitespace: ${CORS_ORIGIN}"
    exit 1
  fi
'

run_test "package.json version check" \
  node -e 'console.log(require("./package.json").version ? "ok" : process.exit(1))' >/dev/null

echo "==============================="
echo "✅ Passed: ${PASS}"
echo "❌ Failed: ${FAIL}"
echo "==============================="

if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi

exit 0


