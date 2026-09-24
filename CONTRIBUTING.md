# Contributing to AI Roast Battle

Thanks for contributing to **AI Roast Battle**.

The project is a small browser comedy game, so contributions should improve the actual player experience, reliability, security, or maintainability without making the game feel like a generic AI-generated interface.

## Before You Start

Please check the existing project structure and current issues before making changes.

For larger changes, open an issue or discuss the idea first.

## How to Contribute

### 1. Fork or clone the repository

```bash
git clone https://github.com/Devputta/connect.git
cd connect
```

### 2. Create a branch

Use a clear branch name:

```bash
git checkout -b feature/better-roast-results
```

Examples:

- `feature/daily-challenge`
- `feature/battle-timer`
- `fix/ai-timeout`
- `fix/mobile-layout`
- `security/input-validation`

### 3. Make your changes

Keep changes focused. Avoid unrelated formatting or large rewrites unless they are necessary.

### 4. Test locally

Before submitting a contribution, verify:

- The application starts successfully.
- The main battle flow works.
- User input is handled safely.
- AI failures and timeouts do not break the game.
- The 30-second round behaves correctly.
- Results are displayed correctly.
- The UI works on mobile and desktop.
- No API keys or secrets are committed.

### 5. Commit your changes

Use a clear commit message:

```bash
git add .
git commit -m "Add battle result feedback"
```

Good commit messages describe what changed.

### 6. Push your branch

```bash
git push origin feature/better-roast-results
```

Then open a Pull Request.

## Pull Request Guidelines

A good Pull Request should explain:

- What changed
- Why the change was needed
- How it was tested
- Any limitations or known issues

For UI changes, include screenshots when useful.

For bug fixes, include steps to reproduce the original problem when possible.

## Code Quality

Please:

- Keep functions and components reasonably small.
- Prefer readable code over clever code.
- Validate user-controlled input.
- Handle network and AI failures explicitly.
- Keep secrets in environment variables.
- Avoid unnecessary dependencies.
- Do not commit `.env` files containing real credentials.
- Keep error messages understandable to players.

## AI-Specific Contributions

AI output should be treated as untrusted external data.

Contributions involving the AI layer should consider:

- API timeouts
- Rate limits
- Empty or malformed AI responses
- Unexpected model output
- Prompt injection attempts
- Excessively long input
- Safe error handling
- Server-side API key protection

Do not expose provider API keys in frontend code.

## Game Design Contributions

AI Roast Battle should feel like a real indie game rather than a generic AI dashboard.

Avoid adding:

- Unnecessary cards
- Excessive badges
- Generic AI-themed gradients
- Decorative animations without a purpose
- Fake statistics
- Repetitive AI-generated copy
- Unnecessary settings or screens

When proposing a design change, ask:

> Does this make the game more fun, clearer, or more memorable?

## Security Issues

Please do not create a public issue for a security vulnerability containing sensitive details.

Follow the instructions in [SECURITY.md](SECURITY.md).

## License

By contributing to this project, you agree that your contributions are provided under the project's [MIT License](LICENSE).
