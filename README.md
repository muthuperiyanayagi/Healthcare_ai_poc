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

## Notes

- Use the **John Smith preset** on New Encounter for the diabetes demo path (ICD-10 E11.9, etc.).
- PDF export uses the browser print dialog (`window.print`) with a print stylesheet.
- Encounter data persists in `localStorage`.
