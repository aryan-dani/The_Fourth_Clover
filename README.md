# The Fourth Clover

> A modern, minimalist blogging platform built for writers and thinkers.

![Status](https://img.shields.io/badge/Status-Phase_2_Complete-success?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## Docs in this repo

- [Changelog](frontend/CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

## Features

### Core features

- **Modern design**: Minimal interface with a clear visual hierarchy
- **Writing experience**: Editor with react-hook-form and Zod validation
- **Data tables**: Dashboard with sortable, paginated tables (TanStack Table)
- **Notifications**: Toasts via Sonner
- **Image upload**: Supabase Storage
- **Authentication**: Supabase Auth (e.g. Google OAuth)
- **Responsive** layout and **Next.js App Router** for performance and SEO
- **Auto-save** and drafts workflow

### Social (Phase 2)

- Threaded **comments**
- **Likes** on posts
- **Sharing** (Twitter, WhatsApp, copy link)
- **Profiles** with stats and links
- **Username** validation for URL-safe handles

## Quick start

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) project

### Install and run

1. **Clone and enter the app directory**

   ```bash
   git clone https://github.com/aryan-dani/The-Fourth-Clover.git
   cd The-Fourth-Clover/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Set at least:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Optional but recommended for correct canonical URLs, Open Graph, and metadata:

   ```env
   NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
   ```

4. **Database**

   Create tables, RLS, and storage in the **Supabase dashboard** (SQL Editor or your own exported SQL). Types in the app are aligned with `frontend/src/types/database.ts`.

5. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

All npm scripts (`dev`, `build`, `start`, `lint`, `type-check`, etc.) run from **`frontend/`** — that is the only `package.json` for the application.

## Tech stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **UI**: Tailwind CSS, shadcn/ui (Radix)
- **Forms**: React Hook Form, Zod
- **Tables**: TanStack Table
- **Motion / icons**: Framer Motion, Lucide
- **Typography**: Charter (body), Playfair Display (headings)
- **Backend**: Supabase (Postgres, Auth, Storage, RLS)

## Project layout

```
The-Fourth-Clover/
├── frontend/                 # Next.js app (single package — install & run here)
│   ├── src/
│   │   ├── app/              # Routes (groups: marketing, auth, main, account, dev-only)
│   │   ├── components/       # Layout + shadcn/ui
│   │   ├── features/         # auth, comments, notifications, data
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── scripts/              # Optional: inspect-schema, query-tool, verify-supabase
│   └── public/
├── CONTRIBUTING.md
├── LICENSE
├── netlify.toml              # base = "frontend"
└── README.md
```

## Database (overview)

- **profiles**, **posts**, **comments**, **likes** (and related policies)
- RLS on user-facing tables, indexes and FKs as appropriate

## Development helpers

Optional Node scripts (from repo root, paths relative to clone):

```bash
node frontend/scripts/inspect-schema.js
node frontend/scripts/verify-supabase.js
```

Run them with a filled-in `frontend/.env.local`.

## CI (GitHub Actions)

On push and pull requests to `main` or `master`, the workflow in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs **`npm run lint`**, **`npm run type-check`**, and **`npm run build`** in `frontend/` (with placeholder Supabase env vars for the build step).

## Deployment (Netlify)

1. Connect the repo to Netlify.
2. Set **Base directory** to **`frontend`** (must match `base` in `netlify.toml`).
3. Configure the same `NEXT_PUBLIC_*` env vars as in `.env.local` (including `NEXT_PUBLIC_SITE_URL` in production for metadata).
4. Deploy (`npm run build` runs inside `frontend/`).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE).

## Support

Email support@thefourthclover.com or open a GitHub issue.
