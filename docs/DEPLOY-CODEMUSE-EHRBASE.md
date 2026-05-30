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
│  clinicalFhir   │ ─────────────────────────────► │ NUM FHIR Bridge          │
│  /api/clinical  │                                │ (infra/fhir-bridge)      │
└─────────────────┘                                └────────────┬─────────────┘
                                                                │ openEHR REST
                                                                ▼
                                                   ┌──────────────────────────┐
                                                   │ ehrbase.codemuseai.com   │
                                                   │ /ehrbase (openEHR API)   │
                                                   └──────────────────────────┘
```

EHRbase exposes the **openEHR REST API** (Swagger, AQL). It does **not** serve FHIR R4 at `/rest/fhir/R4`.

This app speaks **FHIR** for chart data. Use **[NUM FHIR Bridge](https://github.com/NUM-Forschungsdatenplattform/num-fhir-bridge)** between the app and EHRbase.

| Layer | Role | Env (app) |
|-------|------|-----------|
| Administrative FHIR | Patient, Practitioner, Appointment, kiosk queues | `FHIR_BASE_URL` |
| **NUM FHIR Bridge** | FHIR R4 ↔ openEHR compositions | `FHIR_BRIDGE_URL` |
| EHRbase | Persistent openEHR store | `EHRBASE_OPENEHR_URL` (bridge config) |
| openFHIR (optional) | FHIR ↔ openEHR mapping / templates | `OPENFHIR_URL` — **not** the clinical FHIR API |

## Install FHIR Bridge (required)

From this repo:

```bash
cd infra/fhir-bridge
cp .env.example .env
# Edit .env if EHRbase uses basic auth
chmod +x install.sh
./install.sh
```

This pulls `numresearchdataplatform/num-fhir-bridge` and starts it on port **8888**.

Verify:

```bash
curl -sS http://localhost:8888/fhir-bridge/fhir/metadata | head
```

Bridge defaults:

- Context path: `/fhir-bridge`
- FHIR R4: **`http://host:8888/fhir-bridge/fhir`** → set as `FHIR_BRIDGE_URL` on Vercel
- EHRbase: `FHIR_BRIDGE_OPENEHR_URL` / `fhir-bridge.openehr.url`
- Admin patients: `demographics.patient.url` → `https://term.codemuseai.com/fhir/Patient/`

See [infra/fhir-bridge/README.md](../infra/fhir-bridge/README.md) for compose, build-from-source, and troubleshooting.

### One-line Docker (without this repo)

```bash
docker run -p 8888:8888 \
  -e FHIR_BRIDGE_OPENEHR_URL=https://ehrbase.codemuseai.com/ehrbase/ \
  -e DEMOGRAPHICS_PATIENT_URL=https://term.codemuseai.com/fhir/Patient/ \
  numresearchdataplatform/num-fhir-bridge:latest
```

## openFHIR (optional)

**openFHIR** at `https://openfhir.codemuseai.com` is a separate mapping engine. Do **not** set `FHIR_BRIDGE_URL` to openFHIR.

## Vercel setup

1. Deploy NUM FHIR Bridge on a VM or container host reachable from Vercel.
2. Set environment variables from `.env.example`.
3. `FHIR_BRIDGE_URL` = public bridge base, e.g. `https://bridge.example.com/fhir-bridge/fhir`
4. Deploy the Next.js app.

```env
CLINICAL_BACKEND=ehrbase
FHIR_BASE_URL=https://term.codemuseai.com/fhir
FHIR_BRIDGE_URL=https://<bridge-host>/fhir-bridge/fhir
NEXT_PUBLIC_CLINICAL_BACKEND=ehrbase
```

## Verify after deploy

- Admin → Clinic settings → **Data stores** — FHIR Bridge shows **metadata OK** when reachable.
- `curl "$FHIR_BRIDGE_URL/metadata"` → 200.
- Register patient → admin FHIR; nurse vitals → EHRbase via bridge.

## Full FHIR app (single server)

No bridge required:

```env
CLINICAL_BACKEND=fhir
FHIR_BASE_URL=https://term.codemuseai.com/fhir
```

## Templates

FHIR Bridge maps FHIR to openEHR templates on EHRbase. Missing templates cause create failures even when the bridge is healthy.
