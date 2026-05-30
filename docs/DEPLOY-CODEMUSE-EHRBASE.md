# Deploy: Sentinel by Codemuse (EHRbase product line)

Separate Vercel project from the Lucea/HAPI-only line. **Same UI**; data is split across backends.

## Architecture

```
┌─────────────────┐     Patient / Appointment      ┌──────────────────────────┐
│  Next.js (Vercel)│ ─────────────────────────────► │ term.codemuseai.com/fhir │
│  adminFhir       │                                │ (administrative FHIR)    │
└────────┬────────┘                                └──────────────────────────┘
         │
         │  Observation, Condition, MedicationRequest, …
         ▼
┌─────────────────┐     FHIR R4                    ┌──────────────────────────┐
│  clinicalFhir   │ ─────────────────────────────► │ FHIR Bridge              │
│  /api/clinical  │                                │ (separate service)       │
└─────────────────┘                                └────────────┬─────────────┘
                                                                │ openEHR REST
                                                                ▼
                                                   ┌──────────────────────────┐
                                                   │ ehrbase.codemuseai.com   │
                                                   │ /ehrbase (Swagger =       │
                                                   │  openEHR API, not FHIR)  │
                                                   └──────────────────────────┘
```

EHRbase exposes the **openEHR REST API** (Swagger `MetaData`, `_executed_aql`, paths under `/rest/openehr/v1/…`). It does **not** serve FHIR R4 at `/rest/fhir/R4` on a typical install.

This app speaks **FHIR** for chart data. You need **[FHIR Bridge](https://github.com/ehrbase/fhir-bridge)** (or the maintained fork [num-fhir-bridge](https://github.com/NUM-Forschungsdatenplattform/num-fhir-bridge)) between the app and EHRbase.

| Layer | Role | Env (app) |
|-------|------|-----------|
| Administrative FHIR | Patient, Practitioner, Appointment, kiosk queues | `FHIR_BASE_URL` |
| FHIR Bridge | FHIR R4 ↔ openEHR compositions | `FHIR_BRIDGE_URL` |
| EHRbase | Persistent openEHR store | `EHRBASE_OPENEHR_URL` (bridge config, not the Next app) |

## Deploy FHIR Bridge (operators)

Example Docker (from upstream docs):

```bash
docker run -p 8888:8888 \
  -e "FHIR_BRIDGE_EHRBASE_BASE_URL=https://ehrbase.codemuseai.com/ehrbase/rest/openehr/v1/" \
  --name=fhir-bridge ehrbase/fhir-bridge
```

Or use `docker/docker-compose-full.yml` in the fhir-bridge repo (EHRbase + bridge together).

Bridge defaults (see `application.yml` in fhir-bridge):

- Context path: `/fhir-bridge`
- FHIR R4 servlet: `/fhir` → full base **`http://host:8888/fhir-bridge/fhir`**
- Point bridge at openEHR: `fhir-bridge.openehr.url` / `FHIR_BRIDGE_EHRBASE_BASE_URL`

**Link admin patients to bridge:** set bridge `demographics.patient.url` to your admin FHIR Patient endpoint, e.g. `https://term.codemuseai.com/fhir/Patient/` so `Patient/{id}` in clinical resources matches registration on the admin server.

Verify bridge before wiring Vercel:

```bash
curl -sS "http://localhost:8888/fhir-bridge/fhir/metadata" | head
```

## Vercel setup

1. Create a **new** Vercel project linked to this repo (branch `cursor/ehrbase-product-line-aba7` or `main` after merge).
2. Set environment variables from `.env.example` (Production + Preview).
3. Set `FHIR_BRIDGE_URL` to your **public** bridge FHIR base (not the EHRbase Swagger host unless bridge is mounted there).
4. Deploy — **one** Next.js app serves the full UI; no second app for visualization.

## Environment variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `FHIR_BASE_URL` | `https://term.codemuseai.com/fhir` | Admin FHIR |
| `FHIR_BRIDGE_URL` | `https://fhir-bridge.example.com/fhir-bridge/fhir` | Clinical FHIR (this app) |
| `EHRBASE_OPENEHR_URL` | `https://ehrbase.codemuseai.com/ehrbase` | Documentation / bridge operator reference |
| `EHRBASE_BEARER_TOKEN` / `FHIR_BRIDGE_BEARER_TOKEN` | (secret) | Auth if enabled |
| `CLINICAL_BACKEND` | `ehrbase` | Use bridge for clinical store |
| `NEXT_PUBLIC_CLINICAL_BACKEND` | `ehrbase` | Browser trends → `/api/clinical` |

`EHRBASE_FHIR_URL` is kept as a legacy alias for `FHIR_BRIDGE_URL`.

## Verify after deploy

- Admin → Clinic settings → **Data stores** shows admin FHIR, FHIR Bridge URL, and EHRbase openEHR URL.
- Admin FHIR connection test → **term.codemuseai.com**.
- `curl "$FHIR_BRIDGE_URL/metadata"` → 200 from bridge (not 404 like bare EHRbase `/rest/fhir/R4`).
- Register a patient → admin FHIR.
- Nurse vitals / doctor chart → writes via bridge into EHRbase.
- Trends overlay → browser calls `/api/clinical/Observation?...` → bridge.

## Templates and mappings

FHIR Bridge maps FHIR resources to openEHR templates. Ensure required archetypes/templates exist on your EHRbase instance; otherwise creates may fail even when bridge and URLs are correct.

## Single-server fallback

Set `CLINICAL_BACKEND=fhir` and point `FHIR_BASE_URL` at one HAPI/Lucea server to behave like the original app (no EHRbase, no bridge).
