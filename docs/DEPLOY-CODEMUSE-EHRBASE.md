# Deploy: Sentinel by Codemuse (EHRbase product line)

Separate Vercel project from the Lucea/HAPI-only line. **Same UI**; data is split across two backends.

## Architecture

| Data | Server | Env |
|------|--------|-----|
| Patient, Practitioner, Appointment, Basic (kiosk queues) | `https://term.codemuseai.com/fhir` | `FHIR_BASE_URL` |
| Observations, Conditions, Medications, Encounters, Orders | EHRbase FHIR API | `EHRBASE_FHIR_URL` |

Patient IDs in EHRbase references use the **same** `Patient/{id}` from the admin FHIR server.

## Vercel setup

1. Create a **new** Vercel project linked to this repo (branch `cursor/ehrbase-product-line-aba7` or `main` after merge).
2. Set environment variables from `.env.example` (Production + Preview).
3. Deploy — **one** Next.js app serves the full UI; no second app for visualization.

## EHRbase FHIR URL

Default: `https://ehrbase.codemuseai.com/ehrbase/rest/fhir/R4`

If metadata returns 404, confirm the FHIR path with your EHRbase operator and set `EHRBASE_FHIR_URL` accordingly. Auth token goes in `EHRBASE_BEARER_TOKEN`.

## Verify after deploy

- Admin → Clinic settings → FHIR connection test should hit **term.codemuseai.com** (admin).
- Register a patient → appears on admin FHIR.
- Nurse vitals / doctor chart → writes go to **EHRbase** (check EHRbase logs).
- Trends overlay → browser calls `/api/clinical/Observation?...`.

## Single-server fallback

Set `CLINICAL_BACKEND=fhir` and point `FHIR_BASE_URL` at one server to behave like the original app.
