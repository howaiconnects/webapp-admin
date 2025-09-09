# Deploy Latitude-llm on Azure VM with Traefik (step-by-step)

This document describes a repeatable, secure deployment of Latitude-llm on an Ubuntu Azure VM, fronted by Traefik as a reverse proxy handling routing and TLS. It targets the production subdomain latitude.totallybot.com pointed at VM IP 68.220.176.9 and includes explicit instructions to bind the Traefik dashboard to localhost so Traefik will not request certificates for dashboard.latitude.totallybot.com.

Prerequisites
- Azure subscription and permission to create resources.
- DNS control for totallybot.com to create A records.
- VM public IP: 68.220.176.9 assigned to your target VM.
- A non-root admin user on the VM with SSH key access.
- Docker and docker compose v2 installed on the VM.
- Optional but recommended: Azure Key Vault for secrets.

High level
1. Prepare Azure VM (NSG rules, Docker).
2. Configure DNS A record: latitude.totallybot.com -> 68.220.176.9
3. Create Traefik configuration (static and dynamic) that:
   - Routes latitude.totallybot.com to the Latitude container
   - Uses ACME to obtain TLS for latitude.totallybot.com
   - Prevents Traefik from requesting certificates for the dashboard by binding the dashboard to localhost only
4. Create docker-compose for services: traefik, latitude, postgres, redis
5. Configure environment and secrets securely.
6. Start stack and verify.

DNS
- Create an A record:
  - host: latitude
  - type: A
  - value: 68.220.176.9
  - TTL as desired (default is fine)
- Propagation: verify via dig or nslookup:
  - dig +short latitude.totallybot.com

Azure VM prepare
1. Create VM (Ubuntu 22.04 LTS recommended).
2. NSG / Firewall:
   - Allow SSH (22) from admin IPs only.
   - Allow HTTP (80) and HTTPS (443) from the world (Traefik needs to respond to ACME).
   - Do NOT open Postgres (5432), Redis (6379), Qdrant (6333) publicly. Restrict them to private network or localhost.
3. Storage: use Premium SSD and an attached volume for DB persistence if running Postgres locally.
4. Create a non-root user and configure SSH key auth. Disable password auth.

Install Docker and docker compose
- Quick commands:
  - sudo apt update && sudo apt upgrade -y
  - sudo apt install -y ca-certificates curl gnupg lsb-release
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  - sudo apt update
  - sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  - sudo usermod -aG docker $USER  # logout/login or newgrp docker

Secrets and environment variables
- Use Azure Key Vault ideally. Otherwise keep a secure /srv/latitude/.env file with 600 perms.
- Required envs (examples):
  - NEXTAUTH_SECRET
  - ENCRYPTION_KEY
  - DATABASE_URL
  - REDIS_URL
  - QDRANT_URL
  - QDRANT_API_KEY
  - LATITUDE_SECRET
  - NODE_ENV=production
- Generate secrets securely:
  - openssl rand -hex 32

Traefik design notes
- Traefik will be the only service exposed on 80/443.
- ACME (LetsEncrypt) will be used with a certresolver; enable HTTP-01 challenge.
- Important: prevent Traefik from trying to create certs for internal dashboards:
  - Bind the Traefik dashboard to localhost only and do not create any public router for dashboard.latitude.totallybot.com.
  - Avoid wildcard host rules in routers that could cause Traefik to request certs for unintended subdomains.

Explicit instructions to bind Traefik dashboard to localhost (recommended)
- Goal: ensure Traefik API/dashboard is reachable only from the VM (or via SSH tunnel) and never exposed publicly. This prevents Traefik from requesting a cert for dashboard.latitude.totallybot.com.
- Method A — Static config bind to localhost (simplest):
  - In your Traefik static config file (example path: `traefik/traefik.yml`), enable the api but do not create a router for it. Instead only bind the dashboard to an internal port on localhost using the entryPoint that listens on 127.0.0.1.
  - Example static config snippet:
    ```yaml
    api:
      insecure: false
      dashboard: true

    entryPoints:
      web:
        address: ":80"
      websecure:
        address: ":443"
      traefik-local:
        address: "127.0.0.1:8080"
    ```
  - Do NOT add any labels on services that create a router with Host rule for dashboard.latitude.totallybot.com.
  - Mount this static config into the Traefik container and ensure the traefik-local entryPoint is not reachable from outside the host.

- Method B — Use a middleware and binding with docker labels (alternative)
  - You can create a router for the dashboard that uses an entryPoint bound to localhost only. This is more complex and unnecessary for most setups; prefer Method A.

- Accessing dashboard safely:
  - Use an SSH tunnel from your workstation:
    - ssh -L 8080:127.0.0.1:8080 your-user@68.220.176.9
    - Open http://localhost:8080/dashboard/ locally
  - Or run curl against 127.0.0.1:8080 on the VM.

Traefik static configuration example (file: `traefik/traefik.yml`)
- Full example to mount at runtime:
  - api:
      dashboard: true
    entryPoints:
      web:
        address: ":80"
      websecure:
        address: ":443"
      traefik-local:
        address: "127.0.0.1:8080"
    providers:
      docker:
        exposedByDefault: false
    certificatesResolvers:
      letsencrypt:
        acme:
          email: you@example.com
          storage: /acme/acme.json
          httpChallenge:
            entryPoint: web

- Notes:
  - `exposedByDefault: false` forces explicit labels to expose containers publicly.
  - traefik-local is bound to localhost so the dashboard is not served on the public IP.

Traefik dynamic configuration / docker-compose labels
- Use docker provider and labels on containers to create routers.
- Latitude service labels (example in compose):
  - traefik.enable=true
  - traefik.http.routers.latitude.rule=Host(`latitude.totallybot.com`)
  - traefik.http.routers.latitude.entrypoints=websecure
  - traefik.http.routers.latitude.tls.certresolver=letsencrypt
- Ensure no service or label defines a router for dashboard.latitude.totallybot.com.

Disable Traefik dashboard certificate issuance (explanation)
- Traefik only requests certificates for routers that are attached to entryPoints that support TLS (websecure) and have a TLS configuration (certresolver). If you avoid creating any router with a Host that matches dashboard.latitude.totallybot.com, Traefik will not attempt to obtain a certificate for it.
- By binding the dashboard to `127.0.0.1:8080` via `traefik-local` you ensure the dashboard is not exposed on `websecure`, eliminating any ACME attempts for that name.

Docker compose example (file: `latitude-llm/docker-compose.yml`)
- The repository contains a template docker-compose example. Below is a ready-to-use example to place in `latitude-llm/docker-compose.yml`. Adapt images, versions, and env_file paths as needed.

version: "3.8"
services:
  traefik:
    image: traefik:v2.10
    restart: unless-stopped
    command:
      - "--configFile=/etc/traefik/traefik.yml"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/acme.json:/acme/acme.json
    networks:
      - web
      - internal
    labels: {}
...
## GitHub fork clone and deploy workflow

If you prefer to host your Latitude fork on GitHub and deploy directly from the VM, follow these steps.

1. Clone your fork on the Azure VM and start the stack

    ```bash
    # on the VM
    git clone https://github.com/your-org/latitude-llm.git
    cd latitude-llm

    # copy example env and edit with secrets (use Azure Key Vault or secure file perms)
    cp .env.example .env.local
    nano .env.local

    # start services
    docker compose -f docker-compose.yml up -d
    ```

2. Updating the deployment (deploy new commits)

    ```bash
    # on the VM
    cd ~/latitude-llm
    git pull origin main
    docker compose -f docker-compose.yml up -d
    ```

3. Secure GitHub access options

- Deploy SSH key (recommended)
  1. On the VM, generate a dedicated deploy key:
     ```bash
     ssh-keygen -t ed25519 -f ~/.ssh/latitude_deploy_key -N ""
     ```
  2. Add the public key (`~/.ssh/latitude_deploy_key.pub`) as a read-only Deploy Key in your GitHub repository (Settings → Deploy keys → Add deploy key).
  3. Configure the VM to use the key for GitHub (add to `~/.ssh/config`):
     ```
     Host github.com
       HostName github.com
       User git
       IdentityFile ~/.ssh/latitude_deploy_key
       IdentitiesOnly yes
     ```
  4. Test: `git ls-remote git@github.com:your-org/latitude-llm.git`

- Personal Access Token (PAT) (alternative)
  - Create a PAT with repo read permissions, store it securely (do not commit). On the VM you can store it in `~/.git-credentials` and configure git:
    ```bash
    git config --global credential.helper store
    git credential approve <<EOF
    protocol=https
    host=github.com
    username=your-username
    password=ghp_...
    EOF
    ```
  - Note: PATs are more sensitive; prefer a deploy key for read-only access.

4. CI / automated deployment (optional)
- You can add a GitHub Actions workflow to build/push images and SSH into the VM to run `docker compose` or use GitHub's deployments. Store SSH private key or deployment secrets in GitHub Secrets and limit scope.

Notes
- Ensure the VM can reach GitHub (outbound HTTPS/SSH).
- Keep `.env.local` and any credential files with strict permissions (chmod 600).
- If you use a deploy key, rotate it periodically and remove it from the repo when no longer needed.