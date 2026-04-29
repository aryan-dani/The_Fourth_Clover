# Contributing to The Fourth Clover

We welcome issues, discussion, fixes, and feature ideas.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Add or update tests when behavior changes.
3. Update docs (e.g. README) if setup or APIs change.
4. Ensure `npm run lint` and `npm run type-check` pass in `frontend/`.
5. Open the PR with a clear description.

## Local setup

1. **Clone**

   ```bash
   git clone https://github.com/aryan-dani/The-Fourth-Clover.git
   cd The-Fourth-Clover/frontend
   ```

2. **Install**

   ```bash
   npm install
   ```

3. **Env**

   ```bash
   cp .env.example .env.local
   ```

   Add your Supabase URL and anon key.

4. **Run**

   ```bash
   npm run dev
   ```

## Code style

- TypeScript; match existing formatting and patterns.
- Prefer small, focused components and shared utilities in `src/lib` / `src/features`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) are encouraged (`feat:`, `fix:`, `docs:`, etc.).

## License

Contributions are accepted under the [MIT License](LICENSE).
