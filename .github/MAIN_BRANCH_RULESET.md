# Simple Branch Protections

## Main Branch Protection

Apply these basic settings in GitHub: Settings → Branches → Add rule for `main`:

### Required Settings
1. **Require pull request reviews before merging**
   - Required approving reviews: 1
   - Dismiss stale reviews: Yes

2. **Require status checks to pass before merging**
   - Require CI to pass
   - Require branches to be up to date: Yes

3. **Restrictions**
   - Restrict pushes: No (allow anyone with write access)
   - Block force pushes: Yes
   - Block deletions: Yes

### Optional Settings (Standard)
- Require linear history: Yes
- Include administrators: No (admins can override in emergencies)

That's it! Simple and standard protections.