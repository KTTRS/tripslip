# TripSlip

Digital permission slips that actually get signed. Built for **Junior Achievement of Southeastern Michigan**.

TripSlip replaces paper permission slips with a mobile-first workflow: JA creates experiences, teachers manage rosters, and parents sign + pay from a single SMS link.

## How It Works

```
JA Dashboard → Teacher → Parent → Auto-Report
```

1. **JA Admin** creates field trip experiences with indemnification documents
2. **Teachers** import student rosters (CSV) and send permission slips
3. **Parents** receive an SMS link, review the waiver, sign on their phone, and pay
4. **Reports** update in real-time — completion rates, payments, fund donations

## Features

- **4-step parent flow** — form, signature capture, payment, confirmation
- **Multi-payment** — Card, Cash App, Venmo, Zelle, Chime, Apple Pay, Google Pay
- **No Student Left Behind** — financial assistance option with TripSlip Field Trip Fund
- **Bilingual** — English and Spanish (auto-switches based on guardian preference)
- **School addendums** — per-school supplemental permission documents
- **CSV import** — bulk student/guardian roster upload
- **Real-time dashboard** — completion metrics, payment tracking, fund totals
- **Supabase backend** — PostgreSQL with Row Level Security, falls back to demo data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Routing | React Router 7 |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL) |
| i18n | i18next |
| Signature | react-signature-canvas |
| Build | Vite 7 |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Install & Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` with pre-loaded demo data (3 experiences, 6 schools, 15 students).

### Connect Supabase (optional)

1. Create a [Supabase](https://supabase.com) project
2. Run the migrations:
   ```bash
   # Using Supabase CLI
   supabase db push
   # Or manually run:
   #   supabase/migrations/00001_initial.sql
   #   supabase/migrations/00002_add_indemnification.sql
   ```
3. Optionally seed demo data:
   ```bash
   psql $DATABASE_URL < supabase/seed.sql
   ```
4. Copy `.env.example` to `.env` and fill in your keys:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart the dev server — TripSlip will load from Supabase instead of demo data

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages).

## Deploy

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo in the Vercel dashboard — it auto-detects Vite.

Set environment variables in the Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

Push to GitHub and import in Netlify. Build settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

A `netlify.toml` is included for SPA routing.

## Project Structure

```
src/
├── pages/
│   ├── home.tsx          # Landing page with entry points
│   ├── dashboard.tsx     # JA admin — experiences, schools, metrics
│   ├── teacher.tsx       # Teacher — roster, forms, send slips
│   └── parent.tsx        # Parent — 4-step sign + pay flow
├── components/
│   ├── ui/               # Button, Card, Badge, Input
│   ├── signature-pad.tsx # Canvas signature capture
│   ├── document-viewer.tsx
│   ├── metric-card.tsx
│   └── progress-bar.tsx
├── lib/
│   ├── store.ts          # Zustand state + Supabase sync
│   ├── db.ts             # Supabase CRUD operations
│   ├── supabase.ts       # Client initialization
│   └── types.ts          # TypeScript interfaces
├── i18n/
│   ├── index.ts          # i18next config
│   └── locales/          # en.json, es.json
├── App.tsx               # Router + loading screen
├── main.tsx              # Entry point
└── index.css             # Tailwind theme + custom colors

supabase/
├── migrations/
│   ├── 00001_initial.sql           # Tables, indexes, RLS
│   └── 00002_add_indemnification.sql
└── seed.sql              # Demo data
```

## Demo Routes

| Route | View |
|-------|------|
| `/` | Landing page |
| `/dashboard` | JA admin dashboard |
| `/t/i0` | Teacher view (Cass Tech) |
| `/p/tok-s4` | Parent permission slip (DeShawn Mitchell) |

## License

Private — Junior Achievement of Southeastern Michigan
