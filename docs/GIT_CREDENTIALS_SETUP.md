# Git Credentials Setup

## For most users

Use GitHub's standard authentication methods:

1. **GitHub CLI** (recommended):
   ```bash
   # Install gh cli
   sudo apt install gh
   # Authenticate
   gh auth login
   ```

2. **Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a classic token with `repo` scope
   - Use it when prompted for password

3. **SSH Keys**:
   - Generate: `ssh-keygen -t ed25519 -C "your_email@example.com"`
   - Add to GitHub: Settings → SSH and GPG keys

For most development, GitHub CLI (`gh auth login`) is the simplest option.