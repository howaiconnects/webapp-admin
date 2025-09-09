# Branch Protection Policy

This repository uses simple, standard branch protection rules.

## Protection Rules

### Main Branch (`main`)
- Require pull request reviews (1 approval minimum)
- Require status checks to pass (CI must be green)
- Prohibit force pushes
- Prohibit deletions

### Development Workflow
1. Create feature branches from `main`
2. Make your changes
3. Open a pull request
4. Get 1 approval
5. Ensure CI passes
6. Merge via pull request

## Security
- Pre-commit hook prevents committing `.env*.local` files
- All changes go through pull request review process
- CI validates code before merge

That's it! Keep it simple.