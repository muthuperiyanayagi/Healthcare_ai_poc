# Operyx AI Clinical Intelligence Platform

Premium healthcare SaaS demo built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, and Recharts. All clinical AI, coding, CDS, chat, FHIR, and analytics use **deterministic mock services** with simulated latency — no API keys required.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo login:** `demo@operyx.ai` / `demo123`

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Demo authentication |
| `/dashboard` | KPIs, weekly charts, recent encounters |
| `/encounters/new` | New encounter + AI documentation |
| `/encounters` | History (search, filter, pagination) |
| `/encounters/[id]` | Encounter detail + FHIR/PDF export |
| `/analytics` | Interactive analytics charts |
| `/ask` | Ask Operyx AI chat |
| `/settings` | Org/doctor/AI/theme preferences |

## Epic FHIR integration (SMART on FHIR)

Standalone-launch OAuth2 flow against Epic's sandbox. Requires `NEXT_PUBLIC_FHIR_CLIENT_ID` in `.env`, set to your Epic app's Non-Production Client ID (from fhir.epic.com — Redirect URI must be registered there as `http://localhost:3000/api/auth/fhir/callback`, and Incoming APIs must include Patient.Read + Encounter.Read).

**Start a login:**
```
http://localhost:3000/api/auth/fhir/launch?iss=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/
```
Redirects to Epic's login page; pick a sandbox test patient. On success, lands on `/encounters/new` with real patient data and signs you into the app.

**Test against the public SMART sandbox instead** (no Epic app/credentials needed, but only proves the OAuth mechanics — this specific sandbox path requires a `launch` sim-context param the code doesn't send, so it errors past the authorize step; useful for confirming request shape, not a full green test):
```
http://localhost:3000/api/auth/fhir/launch?iss=https://r4.smarthealthit.org
```

**Diagnostics:**
| Endpoint | Purpose |
|---|---|
| `GET /api/auth/me` | Current session identity (`authenticated`, `user.name/email/role`) |
| `GET /api/fhir/encounters` | Live Encounter fetch for the Epic-launched patient; `reason` field explains an empty result (`no_session_cookie`, `not_epic_session`, `epic_token_expired`, `epic_request_failed`, `epic_returned_no_encounters`, `ok`) |

Code: [`launch/route.ts`](src/app/api/auth/fhir/launch/route.ts) (builds the PKCE authorize redirect) → Epic login → [`callback/route.ts`](src/app/api/auth/fhir/callback/route.ts) (token exchange, resolves patient + clinician identity via the `fhirUser` claim, signs an app session embedding the Epic access token) → [`fhir/encounters/route.ts`](src/app/api/fhir/encounters/route.ts) (uses that embedded token to pull the patient's real Encounter history for the dashboard).

## Notes

- Use the **John Smith preset** on New Encounter for the diabetes demo path (ICD-10 E11.9, etc.).
- PDF export uses the browser print dialog (`window.print`) with a print stylesheet.
- Encounter data persists in `localStorage`.
Patient details autofill

admin/ compliance officer-read only all
customer service-clinical documentation-read only-Patient info(write)
 doctor- no revenue cycle,chatbot access,claim readiness
  nurse- roles
  sarah.chen@operyx.ai / demo123