# Contributing to The Fourth Clover

We love your input! We want to make contributing to The Fourth Clover as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/aryan-dani/The_Fourth_Clover.git
   cd The_Fourth_Clover
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

### Code Style

- We use TypeScript for type safety
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Write comments for complex logic
- Keep components small and focused

### Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting, missing semicolons, etc.
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

Example:

```
feat: add image upload to post editor
fix: resolve post saving error with missing columns
docs: update README with deployment instructions
```

### Issues

We use GitHub issues to track public bugs. Please ensure your description is clear and has sufficient instructions to be able to reproduce the issue.

### Feature Requests

Feature requests are welcome! Please provide:

- Clear description of the feature
- Why this feature would be useful
- How it should work
- Any design considerations

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or reach out to the maintainers if you have any questions!
