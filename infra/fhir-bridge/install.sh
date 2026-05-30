#!/usr/bin/env bash
# Install and start NUM FHIR Bridge for Codemuse EHRbase product line.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker, then re-run: ./install.sh"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required (docker compose)."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env — edit EHRbase credentials if needed, then re-run ./install.sh"
  exit 0
fi

echo "Pulling numresearchdataplatform/num-fhir-bridge …"
docker compose pull

echo "Starting FHIR Bridge …"
docker compose up -d

echo ""
echo "Waiting for FHIR metadata (up to ~2 min on first start) …"
for i in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:${FHIR_BRIDGE_PORT:-8888}/fhir-bridge/fhir/metadata" >/dev/null 2>&1; then
    echo "OK  http://127.0.0.1:${FHIR_BRIDGE_PORT:-8888}/fhir-bridge/fhir/metadata"
    echo ""
    echo "Set on Vercel (EHRbase product line):"
    echo "  FHIR_BRIDGE_URL=http://<your-public-host>:8888/fhir-bridge/fhir"
    echo "  CLINICAL_BACKEND=ehrbase"
    exit 0
  fi
  sleep 3
done

echo "Bridge not ready yet. Check logs: docker compose logs -f fhir-bridge"
exit 1
