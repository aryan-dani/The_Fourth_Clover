# 🍀 The Fourth Clover

> A modern, minimalist publishing and blogging platform built for writers, thinkers, and creators.

[![Status](https://img.shields.io/badge/Status-Actively_Developed-success?style=for-the-badge)](https://github.com/aryan-dani/The-Fourth-Clover)
[![Next.js](https://img.shields.io/badge/Next.js-16_Turbopack-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

Welcome to **The Fourth Clover**, a production-ready Open Source publishing platform. Enjoy writing experiences with beautiful minimal UI, sophisticated performance architectures with Next.js App Router, and robust features powered by Supabase.

✨ **Support the Project!**
If you like what you see, please consider giving this repository a ⭐ to help others find it!

---

## 📖 Docs and Resources

- [Changelog](frontend/CHANGELOG.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Feedback & Survey](https://forms.gle/your-feedback-form-link) _(Please share your thoughts!)_

---

## ✨ Features

### 🚀 Performance & Architecture

- **Next.js App Router**: Leverages React Server Components to strip JavaScript from the initial load.
- **Bundle Deflation**: Granular `Framer Motion` imports via `<LazyMotion>` drastically reduces client-side JS overhead.
- **Optimized Data Pipeline**: Smart `<Image>` sizes attributes & granular targeted Supabase RPC queries instead of heavy client iterations.
- **Seamless UX**: Zero layout shift (CLS) through intelligent Skeleton layouts and Server Component caching.

### 📝 Core Platform Capabilities

- **Modern Minimal Design**: Seamless dark/light layouts crafted with `shadcn/ui` and `Tailwind`.
- **CSI Tech Blog (`/csi`)**: Dedicated publication hub for CSI MIT-WPU technical members with a hero feed, tag filter chips, member directory, editorial review queue (`/csi/review`), and dedicated RSS feed (`/csi/feed.xml`).
- **Sanitized Markdown & Syntax Highlighting**: Rich technical articles rendered via `react-markdown`, `remark-gfm`, `rehype-sanitize`, and `rehype-highlight`, complete with automatic Table of Contents (`h2`/`h3`) and responsive figures.
- **Rich Editor with Inline Images**: Write/Preview toggle, multi-image uploads (toolbar button, drag-and-drop, and clipboard paste) with required alt-text prompts, bound to `react-hook-form` and `zod` schema validations.
- **Editorial Review Workflow**: Role-based `draft -> in_review -> published` pipeline enforced by Supabase RLS and Postgres triggers, with editor approval and change-request notifications.
- **Content Dashboard**: Data tables mapped with sorting, publication badges, and `In Review` filtering via TanStack Table.
- **Notifications & UI**: Real-time toast updates driven by Sonner and deep-linked notification routing.
- **Media Support**: Cover and inline image uploads bound directly to Supabase Storage (`post-images` bucket).
- **Auth**: Fully backed by Supabase Auth protocols (OAuth & Email).

### 👥 Social Dynamics

- Threaded **comments**
- **Likes** and follower feeds.
- **Dynamic Profiles** featuring user stats, avatars, and linked networks.

---

## 🛠️ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com) project database

### Installation Pipeline

1. **Clone the repository**

   ```bash
   git clone https://github.com/aryan-dani/The-Fourth-Clover.git
   cd The-Fourth-Clover/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy the example environment pattern:

   ```bash
   cp .env.example .env.local
   ```

   Provide your Supabase keys and CSI Tech Weekly server secrets:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PRN_HASH_SECRET=your_random_32_byte_hex_secret
   SUPER_ADMIN_EMAIL=your_super_admin_google_email
   ```

4. **Initialize Database & Seed CSI Roster**
   Push the SQL migrations from the repository root (`npx supabase db push`), then seed the private CSI MIT-WPU roster CSV (gitignored so no member PII is ever committed):

   ```bash
   npm run seed:roster -- ./roster.csv
   ```

   Run the automated RLS, trigger, and concurrency security verification suite:

   ```bash
   npm run test:security
   ```

5. **Spin up the environment**
   We optimize local speeds directly using Turbopack:
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

_(Note: All configuration and scripts are run out of the `frontend/` directory)._

---

## 💻 Tech Stack Deep-Dive

- **Framework**: Next.js 16 (App Router) + Turbopack
- **Language**: TypeScript (ES2015 Target)
- **UI Frameworks**: Tailwind CSS, shadcn/ui (Radix Primitives)
- **Database & Auth**: Supabase (PostgreSQL)
- **Client Forms**: React Hook Form, Zod
- **Tables & Motion**: TanStack Table, Framer Motion (`LazyMotion` architecture), Lucide Icons
- **Typography Engine**: Charter, Playfair Display

---

## 🤝 Contributing

We heartily welcome community input! Check out the [Contributing Guide](CONTRIBUTING.md) to get involved. Feel free to:

1. Open an Issue with feedback or suggestions
2. Create PRs for feature enhancements
3. Star the repo to show support ⭐

## 📄 License

This repository is available under the [MIT License](LICENSE).

- **Backend**: Supabase (Postgres, Auth, Storage, RLS)

## Project layout

```
The-Fourth-Clover/
├── frontend/                 # Next.js app (single package - install & run here)
│   ├── src/
│   │   ├── app/              # Routes (groups: marketing, auth, main, account, dev-only)
│   │   ├── components/       # Layout + shadcn/ui + post renderer
│   │   ├── features/         # auth, comments, notifications, data, write
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── scripts/              # Optional: inspect-schema, query-tool, verify-supabase
│   └── public/
├── supabase/
│   └── migrations/           # SQL schema migrations and RLS policies
├── CONTRIBUTING.md
├── LICENSE
├── netlify.toml              # base = "frontend"
└── README.md
```

## Database (overview)

- **profiles**, **posts**, **publications**, **publication_members**, **comments**, **likes**, **notifications**, **follows** (and related policies)
- RLS on all user-facing tables and storage buckets, with restrictive publication workflow enforcement (`draft -> in_review -> published`)
- Apply migrations with `supabase db push` from the repository root

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

Email daniaryan212@gmail.com or open a GitHub issue.
