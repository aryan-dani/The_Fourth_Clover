# The Fourth Clover

Editorial publication for CSI MIT-WPU — essays and verse in the **Journal**, engineering dispatches in **CSI Tech Weekly**.

**Live:** [fourthclover.bio](https://fourthclover.bio)  
**Stack:** Next.js 16 · React 19 · TypeScript 7 · Tailwind 4 · Supabase

[![CI](https://github.com/aryan-dani/The_Fourth_Clover/actions/workflows/ci.yml/badge.svg)](https://github.com/aryan-dani/The_Fourth_Clover/actions/workflows/ci.yml)

---

## What it is

The Fourth Clover is a dual-surface publishing platform:

| Surface | Who writes | What you get |
| --- | --- | --- |
| **Journal** (`/journal`) | Any signed-in author | Prose & poetry, topics, list/card layouts |
| **Tech Weekly** (`/tech-weekly`) | Verified CSI Tech members | Weekly cycles, review desk, featured picks, LinkedIn-ready copy |

Shared foundation: Supabase Auth, row-level security, markdown with sanitization, notifications, follows, and a Forest & Parchment design system (light + dark).

---

## Features

- **Journal** — sort, format filters, topic browse, infinite load, editorial typography
- **CSI Tech Weekly** — submission windows, curation desk, reactions, comments, issue archive
- **Write flow** — draft → in review → published, inline images with alt text, autosave
- **Roles** — member / tech_member / tech_head / super_admin via profile + CSI verification
- **Motion** — GSAP + Lenis smooth scroll, wipe-fill controls, glass nav dock
- **Feeds** — Journal RSS (`/feed.xml`) and Tech Weekly RSS (`/csi/feed.xml`)
- **Quality gate** — `npm run check` (lint, types, markup) on every commit via Husky; CI on Node 22

---

## Quick start

**Prerequisites:** Node.js **22+**, npm 10+, a Supabase project.

```bash
git clone https://github.com/aryan-dani/The_Fourth_Clover.git
cd The_Fourth_Clover/frontend
npm install
cp .env.example .env.local   # if present; otherwise create .env.local
```

Minimal env:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=          # server scripts / admin only
PRN_HASH_SECRET=                    # CSI verification
SUPER_ADMIN_EMAIL=
```

Apply migrations from the repo root, then run the app from `frontend/`:

```bash
# from repo root
npx supabase db push

# from frontend/
npm run seed:roster -- ./roster.csv   # optional; CSV is gitignored
npm run test:security                 # optional RLS / trigger suite
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts (`frontend/`)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Turbopack dev server |
| `npm run build` / `npm run serve` | Production build / start |
| `npm run check` | Lint + type-check + markup (pre-commit) |
| `npm run lint` / `npm run type-check` | Individual gates |
| `npm run seed:roster` | Seed CSI roster |
| `npm run test:security` | RLS / security checks |
| `npm run db:verify` | Verify Supabase connectivity |

---

## Project layout

```
The_Fourth_Clover/
├── frontend/                 # Next.js app — install & run here
│   ├── src/app/              # Routes: (main), (account), (auth), (marketing)
│   ├── src/components/       # Layout, editorial UI, shadcn
│   ├── src/features/         # Auth, data, write, notifications
│   ├── src/lib/              # Supabase, roles, motion helpers
│   └── scripts/              # DB inspect, seed, security tests
├── supabase/migrations/      # Schema + RLS
├── .github/workflows/ci.yml  # Node 22 · npm ci · check · build
├── netlify.toml              # base = frontend
└── README.md
```

---

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Radix / shadcn |
| Language | TypeScript 7 (`tsc` CLI; TS 6 API alias for ESLint) |
| Data / Auth | Supabase (Postgres, Auth, Storage, RLS) |
| Forms | React Hook Form + Zod 4 |
| Motion | GSAP, Lenis |
| Deploy | Netlify (`frontend` base) or any Node host |

---

## Database (overview)

Core tables include `profiles`, `posts`, `publications`, `tech_weeks`, `tech_submissions`, comments/reactions, notifications, and follows — all behind RLS. Apply with `supabase db push` from the repository root.

---

## CI & deploy

**CI** (push/PR to `main`): install with `npm ci`, run `npm run check`, then `npm run build` with placeholder Supabase env.

**Netlify**

1. Set **Base directory** to `frontend` (see `netlify.toml`).
2. Mirror production `NEXT_PUBLIC_*` (and secrets) from `.env.local`.
3. Deploy.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs should keep `npm run check` green.

## License

[MIT](LICENSE)

## Support

Email [daniaryan212@gmail.com](mailto:daniaryan212@gmail.com) or open a GitHub issue.
