# Data Sharing Playbook

**Project:** OperyxAI Clinical Platform (Healthcare AI POC)
**Scope:** Governs every path where Protected Health Information (PHI) enters, leaves, or is processed by this application.
**Status:** Required before any real (non-synthetic) patient data is used. Current code state includes gaps called out below.

---

## 1. Why this exists

This app does two things that create HIPAA-relevant data flows:

1. Pulls real patient data from an EHR via SMART on FHIR (`src/app/api/auth/fhir/launch`, `.../callback`, `src/app/api/fhir/encounters`).
2. Sends clinical text and audio to a third-party AI provider for transcription, chat, and note generation (`src/app/api/speech-to-text`, `src/app/api/chat`, `src/app/api/generate`), currently `generativelanguage.googleapis.com` (public Gemini API) via `GEMINI_API_KEY`.

Neither flow currently has a documented data-sharing agreement, and the public Gemini API endpoint is **not BAA-covered**. README.md's "all mocked, no API keys required" claim is out of date relative to this code and should not be relied on as a compliance statement.

---

## 2. Data flow inventory

| # | Flow | Source → Destination | Data involved | Current implementation | Agreement required |
|---|------|----------------------|----------------|--------------------------|---------------------|
| 1 | EHR launch | Epic (or other FHIR server) → app | Patient demographics, encounters, clinician identity (`fhirUser`) | OAuth2 PKCE, scopes: `launch patient/Patient.read patient/Encounter.read openid fhirUser` | Data Use / Interconnect agreement with EHR vendor or health system; sandbox terms if using Epic's non-production sandbox |
| 2 | Session token | Epic → app session cookie | Epic access token embedded in signed app session (`src/lib/auth/jwt.ts`) | Signed JWT cookie | N/A (internal), but token handling must meet §5 |
| 3 | Audio transcription | Browser mic → app → Gemini API | Raw patient-encounter audio | `POST speech-to-text` → `generativelanguage.googleapis.com` with `GEMINI_API_KEY` | **BAA required** — not currently in place on this endpoint |
| 4 | Chat / Ask AI | Clinician query (may include patient context) → Gemini API | Free-text clinical questions, possibly PHI | `POST chat` → same public Gemini endpoint | **BAA required** |
| 5 | Note/coding generation | Encounter data → Gemini API | SOAP notes, ICD-10/CPT extraction input (patient clinical detail) | `POST generate` → same public Gemini endpoint | **BAA required** |
| 6 | Audit logging | App → own DB | Access/action logs (`src/app/api/audit/logs`) | Internal Postgres (Neon) | Neon is a subprocessor — needs BAA if any PHI lands in logs |
| 7 | Encounter persistence | App → localStorage / DB | Encounter records | Per README, some data persists in browser `localStorage` | Not encrypted at rest by default; PHI must not live in localStorage without compensating controls |
| 8 | Database | App → Neon PostgreSQL | All persisted patient/encounter data | `DATABASE_URL`, SSL pooled connection | **BAA required with Neon** if this holds real PHI |

---

## 3. Required agreements before real PHI is used

1. **Google / Gemini BAA**
   - The public `generativelanguage.googleapis.com` + API-key path is not eligible for a BAA and its terms permit Google to use input data for service improvement on standard tiers.
   - Action: move flows #3–#5 to **Vertex AI** under a Google Cloud org with a signed BAA (this is already GCP_DEPLOYMENT.md's target architecture — the code has not caught up to it yet), using service-account IAM instead of a bare API key.
   - Until that migration is done, these three routes must run on synthetic/de-identified data only.

2. **EHR / FHIR data use agreement**
   - Confirm terms for the specific FHIR server in use (Epic sandbox = non-production test patients only, no real PHI, no BAA implied). Production Epic connections require a formal agreement with the health system, not just an app registration.

3. **Neon (database subprocessor) BAA**
   - If encounter/patient data is persisted for anything beyond a demo, Neon needs a signed BAA covering the Postgres instance storing it.

4. **Any additional GCP subprocessors**
   - Cloud Storage (audio/PDF), Cloud Speech-to-Text, Secret Manager — all fall under the standard GCP BAA if the GCP org has one executed; confirm it's active for this specific project.

---

## 4. Minimum necessary / de-identification rules

- **Scopes:** FHIR scopes should stay limited to what's used (`Patient.read`, `Encounter.read`) — don't broaden to `patient/*.read` without a corresponding feature need.
- **AI inputs:** Until Vertex AI + BAA is live, strip direct identifiers (name, MRN, DOB, contact info) from any text sent to `chat`/`generate`/`speech-to-text`, or route only synthetic demo patients (e.g., the README's "John Smith preset") through these endpoints.
- **Logs:** Audit logs should record *that* an action happened (user, resource type, timestamp, outcome) — avoid writing full clinical note text into log storage.

---

## 5. Access & session controls

- Epic access tokens are embedded in the app's signed session JWT (`src/lib/auth/jwt.ts`) — treat `JWT_SECRET` as PHI-adjacent; rotate on any suspected leak, store only in Secret Manager, never in `.env` committed to git.
- Role-based access (per README): admin/compliance = read-only all; customer service = clinical docs read-only + patient info write; doctor = no revenue/chatbot/claim-readiness; nurse = TBD. Confirm these boundaries are enforced server-side (in route handlers / middleware), not just hidden in the UI.

## 6. End-user device & credential security (ONC §170.315(d)(5)/(d)(7)/(d)(8))

Requirement: credentials, biometric data, and other sensitive/PII data must never be persisted in clear text; use one-way hashing (e.g. SHA-256+salt) or platform secure storage; secure all data at rest on the end-user device; enforce inactivity timeouts.

Current gaps, verified against the code:

| Control | Requirement | Current state | Gap |
|---|---|---|---|
| Password storage | Salted one-way hash | **Fixed** — `src/lib/auth/password.ts` uses `scryptSync` with a random per-user salt (`salt:hash` hex format), verified with a timing-safe comparison. `login/route.ts` and `src/lib/db/seed-doctor.ts` both use it. | scrypt is CPU/memory-hard, unlike a bare digest, so it resists brute-force/rainbow-table attacks. Existing DB rows hashed with the old unsalted SHA-256 scheme won't match the new format — reseed demo users (`seed-doctor.ts`) or add a one-time migration for any real accounts created under the old scheme. |
| Data at rest on device | No cleartext PII/PHI on end-user device | **Fixed** — `src/stores/local-store.ts` now encrypts every value (`operyx.encounters`, `operyx.session`, `operyx.settings`) with AES-GCM before writing to `localStorage`, via `src/stores/local-crypto.ts`. | The AES key itself lives only in `sessionStorage` (per-tab, cleared when the browser/tab closes), never alongside the ciphertext in `localStorage` — so nothing readable survives past the browser session, and inspecting `localStorage` directly shows only ciphertext. |
| Session encryption | Sensitive tokens not exposed in clear text | `src/lib/auth/jwt.ts` — session cookie is JWE-encrypted (`A256GCM`), httpOnly | Meets the bar. Contingent on `JWT_SECRET` actually being set in production — code currently falls back to a hardcoded default secret with only a console warning if unset (`jwt.ts:6-11`). That fallback defeats the encryption guarantee and must be a hard failure in production, not a warning. **Not yet fixed.** |
| Inactivity timeout | Auto logoff after idle period | None found — session JWT is a flat 24h expiry (`jwt.ts:43`), no idle/activity tracking anywhere in the codebase | No (d)(5) equivalent exists. Needs a client-side idle timer (e.g. 15 min no interaction → force logout + clear session) plus server-side enforcement, not just a long-lived token. **Not yet fixed.** |

Action items (add to §7 tracking):
- [x] Replace SHA-256 password hashing with a salted algorithm (scrypt).
- [ ] Migrate/reseed any accounts stored under the old unsalted SHA-256 hash (old hashes will no longer verify).
- [x] Stop persisting patient encounter data and session payloads in `localStorage` in cleartext — now AES-GCM encrypted with a session-scoped key.
- [ ] Make missing `JWT_SECRET` a hard startup failure in production, not a warning.
- [ ] Implement an inactivity timeout (client idle detection + server-side session expiry) distinct from the flat 24h token lifetime.

## 7. Retention & deletion

- Not currently documented anywhere in the repo. Before production use, define: how long encounter/audio data is retained in GCS and Neon, and the process for a patient data-deletion request across FHIR cache, GCS, Neon, and any AI-provider logs.

---

## 8. Action items to close gaps

- [ ] Move `speech-to-text`, `chat`, `generate` routes from public Gemini API key to Vertex AI under a BAA'd GCP project.
- [ ] Execute BAA with Neon (or migrate to a BAA-covered Postgres provider) before storing real PHI.
- [ ] Confirm/execute EHR data use agreement for any non-sandbox FHIR connection.
- [ ] Define and document retention/deletion policy.
- [ ] Correct README.md's "all mocked, no API keys required" line — it no longer reflects the codebase and could mislead someone about the compliance posture.
- [ ] Verify role-based access restrictions are enforced server-side, not just in the UI layer.
