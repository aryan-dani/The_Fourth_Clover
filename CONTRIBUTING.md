# Contributing to The Fourth Clover

First off, thank you for considering contributing to The Fourth Clover! We welcome issues, bug fixes, feature ideas, and performance enhancements.

## 🚀 How to Contribute

### 1. Issues & Discussions

- Check the issue tracker before opening a new issue. Read through existing conversations.
- For feature requests, create a thread documenting the use-case and an outline of how it fits into the current application flow.

### 2. Pull Requests

1. Fork the repo and create a working branch from `main` (e.g., `feat/my-new-feature` or `fix/nav-bug`).
2. Add or update necessary tests if altering core logic.
3. Update relevant documentation (like the README or component JSDocs).
4. Run scripts within the `frontend/` directory to ensure your branch passes validations:
   - `npm run lint`
   - `npm run type-check`
5. Open a Pull Request! Please include a detailed description of the changes.

---

## 💻 Local Develop Workflow

1. **Clone your fork**

   ```bash
   git clone https://github.com/aryan-dani/The-Fourth-Clover.git
   cd The-Fourth-Clover/frontend
   ```

2. **Install node modules**

   ```bash
   npm install
   ```

3. **Configure the Environment**

   ```bash
   cp .env.example .env.local
   ```

   Add your active Supabase URL and anon key logic.

4. **Spin up Dev Server (With Turbopack)**
   ```bash
   npm run dev
   ```

---

## 📐 Architecture & Code Style Guidelines

- **TypeScript First**: We enforce strict compilation targets to es2015. Please ensure no `any` fallbacks remain in the codebase.
- **Next.js App Router Paradigms**:
  - Keep root elements (`layout.tsx`, database queries) as **Server Components** whenever possible.
  - Ensure `'use client'` logic is properly isolated to interactive leaf components (`like-button.tsx`, `feed-client.tsx`, etc) to avoid bloating the client bundle.
- **Framer Motion**:
  - Heavy animations shouldn't halt the main thread. We utilize `<LazyMotion features={domAnimation}>` paired with `<m.div>` syntax instead of default `<motion.div>` structures. Please preserve this pattern when adding animated UI states!
- **Component Scalability**: Prefer abstraction using `shadcn/ui` components located in `/components/ui/` rather than repeating custom Tailwind elements globally.

## ✨ Commit Conventions

We adhere strictly to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) formats (`feat:`, `fix:`, `docs:`, `perf:` etc) to clearly parse intent.

## 📄 License

Contributions are accepted under the repository's native [MIT License](LICENSE).
