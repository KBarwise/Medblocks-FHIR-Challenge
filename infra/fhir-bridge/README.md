# FHIR Bridge (NUM) for Codemuse

Runs **[num-fhir-bridge](https://github.com/NUM-Forschungsdatenplattform/num-fhir-bridge)** as the clinical FHIR layer in front of EHRbase.

| Endpoint | URL |
|----------|-----|
| FHIR R4 (app → bridge) | `http://localhost:8888/fhir-bridge/fhir` |
| EHRbase openEHR | `https://ehrbase.codemuseai.com/ehrbase/` |
| Admin Patient FHIR | `https://term.codemuseai.com/fhir/Patient/` |

Docker image: [`numresearchdataplatform/num-fhir-bridge`](https://hub.docker.com/r/numresearchdataplatform/num-fhir-bridge)

## Quick install

```bash
cd infra/fhir-bridge
cp .env.example .env
# Edit .env if EHRbase uses basic auth
chmod +x install.sh
./install.sh
```

Verify:

```bash
curl -sS http://localhost:8888/fhir-bridge/fhir/metadata | head
```

## Manual compose

```bash
docker compose up -d
docker compose logs -f fhir-bridge
```

## Vercel

Expose the bridge on a public host (reverse proxy or VM), then set:

```env
CLINICAL_BACKEND=ehrbase
FHIR_BRIDGE_URL=https://<bridge-host>/fhir-bridge/fhir
FHIR_BASE_URL=https://term.codemuseai.com/fhir
NEXT_PUBLIC_CLINICAL_BACKEND=ehrbase
```

## Build from source (optional)

If you need a custom bridge build instead of the Docker Hub image:

```bash
git clone --depth 1 -b develop https://github.com/NUM-Forschungsdatenplattform/num-fhir-bridge.git
cd num-fhir-bridge
mvn -DskipTests clean package
# Or: mvn -Pdocker -DskipTests clean package docker:build
```

See upstream `docker/docker-compose-full.yml` for an all-in-one stack with local EHRbase.

## Troubleshooting

- **Patient references fail** — `ADMIN_FHIR_PATIENT_URL` must end with `/Patient/` and match `FHIR_BASE_URL` on Vercel.
- **Composition errors** — templates must exist on EHRbase; bridge maps FHIR to openEHR archetypes.
- **401 on EHRbase** — set `EHRBASE_SECURITY_TYPE=basic` and user/password in `.env`.
