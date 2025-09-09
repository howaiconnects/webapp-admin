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
## Deploy from a GitHub fork (recommended workflow)

This guide replaces any local-path clone/build instructions and explains how to deploy by cloning your GitHub fork on the Azure VM.

1. Clone your GitHub fork on the Azure VM
   - ssh into the VM as the non-root admin user.
   - Run:
     - git clone https://github.com/your-org/latitude-llm.git
   - Example:
     - git clone https://github.com/your-org/latitude-llm.git /srv/latitude
   - Refer to the repository after cloning: [`latitude-llm`](latitude-llm/:1)

2. Prepare environment locally on the VM
   - Copy the example env file and fill in secrets:
     - cp [`latitude-llm/.env.example`](latitude-llm/.env.example:1) [`latitude-llm/.env.local`](latitude-llm/.env.local:1)
     - Edit [`latitude-llm/.env.local`](latitude-llm/.env.local:1) and set required values (NEXTAUTH_SECRET, DATABASE_URL, REDIS_URL, QDRANT_URL, QDRANT_API_KEY, LATITUDE_SECRET, NODE_ENV=production, etc.)
   - Secure the env file:
     - chmod 600 [`latitude-llm/.env.local`](latitude-llm/.env.local:1)

3. Start the stack with Docker Compose
   - From the repository root on the VM:
     - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) up -d
   - Verify containers:
     - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) ps

---

## Preparing and pushing local code changes to your GitHub fork

When you make local changes on your workstation, follow this workflow to push code to your fork so the VM can pull updates.

1. On your local machine (workstation), configure remotes
   - If you forked the repo on GitHub and cloned from your fork:
     - git remote -v  # confirm origin points to https://github.com/your-org/latitude-llm.git
   - If you originally cloned from upstream, add your fork as "fork":
     - git remote add fork https://github.com/your-org/latitude-llm.git

2. Commit and push changes to your fork's main branch
   - git add .
   - git commit -m "Describe change"
   - git push fork main
   - Or if origin is your fork:
     - git push origin main

3. On the VM, update the deployed code (see "Update & redeploy" below).

---

## Secure authentication options for the VM to clone/pull from GitHub

Choose one of the following secure options for the VM to authenticate with GitHub so it can clone and pull from your fork.

Option A — Deploy SSH key (recommended for read-only access)
1. On your workstation or the VM, generate an SSH key pair for deployment (on the VM if you prefer the private key to never leave the VM):
   - ssh-keygen -t ed25519 -f ~/.ssh/latitude_deploy_key -C "latitude-deploy@vm" -N ""
   - This creates:
     - private key: [`~/.ssh/latitude_deploy_key`](~/.ssh/latitude/latitude_deploy_key:1)
     - public key: [`~/.ssh/latitude_deploy_key.pub`](~/.ssh/latitude/latitude_deploy_key.pub:1)
2. Add the public key as a repository Deploy Key in GitHub:
   - In your fork's GitHub repo -> Settings -> Deploy keys -> Add deploy key.
   - Paste the contents of the public key and check "Allow read access" (do NOT enable write unless you need it).
3. Configure the VM's SSH config to use the deploy key for github.com
   - Edit `~/.ssh/config` (create if missing) and add:
     - Host github.com
         HostName github.com
         User git
         IdentityFile ~/.ssh/latitude_deploy_key
         IdentitiesOnly yes
   - Set permissions:
     - chmod 600 ~/.ssh/latitude_deploy_key
     - chmod 644 ~/.ssh/latitude_deploy_key.pub
4. Test:
   - git -c core.sshCommand="ssh -i ~/.ssh/latitude_deploy_key" clone git@github.com:your-org/latitude-llm.git

Option B — Personal Access Token (PAT) with git-credentials (easier but handle carefully)
1. Create a PAT on GitHub with repo scope limited to your fork (or least privilege required).
2. Store the PAT in `~/.git-credentials` on the VM:
   - printf "https://<PAT>@github.com\n" > ~/.git-credentials
   - chmod 600 ~/.git-credentials
   - Configure git to use it:
     - git config --global credential.helper store
3. Use the HTTPS URL to clone/pull:
   - git clone https://github.com/your-org/latitude-llm.git

Notes:
- Prefer deploy SSH keys when you only need the VM to read the repo.
- If using PATs, limit scope and rotate regularly. Keep credentials file permissions strict (600).

---

## Creating a VM-scoped read-only deploy key (step-by-step)

1. On the VM (recommended so the private key never leaves the VM):
   - ssh-keygen -t ed25519 -f ~/.ssh/latitude_deploy_key -C "latitude-deploy@vm" -N ""
2. Copy the public key:
   - cat ~/.ssh/latitude_deploy_key.pub
3. In your fork's GitHub repo:
   - Settings -> Deploy keys -> Add deploy key
   - Title: "VM read-only deploy key"
   - Key: paste the public key
   - Ensure "Allow read access" is enabled and "Allow write access" is NOT checked
4. Configure `~/.ssh/config` as shown above to use that key for `github.com` on the VM.
5. Test a clone or a pull from the VM: git clone git@github.com:your-org/latitude-llm.git

---

## Update & redeploy (quick workflow)

To update code on the VM and restart the running stack:

1. SSH into the VM:
   - ssh your-user@your-vm-ip
2. Go to the repository directory and pull the latest changes:
   - cd /srv/latitude || cd ~/latitude-llm || cd latitude-llm
   - git pull origin main
3. Restart the stack with docker compose:
   - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) pull
   - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) up -d
   - Optionally recreate containers:
     - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) up -d --force-recreate --remove-orphans
4. Verify services:
   - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) ps
   - docker compose -f [`latitude-llm/docker-compose.yml`](latitude-llm/docker-compose.yml:1) logs -f latitude

---

Notes and scope
- These changes only add GitHub fork workflow guidance (clone from fork, push workflow, secure auth options, read-only deploy key steps, and update/redeploy steps). They do not change Traefik or Docker Compose configurations beyond showing the compose file path references used for starting/restarting the stack.

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

  latitude:
    image: latitude/latitude:latest
    restart: unless-stopped
    env_file:
      - ./latitude-llm/.env.local
    networks:
      - web
      - internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.latitude.loadbalancer.server.port=3000"
      - "traefik.http.routers.latitude.rule=Host(`latitude.totallybot.com`)"
      - "traefik.http.routers.latitude.entrypoints=websecure"
      - "traefik.http.routers.latitude.tls.certresolver=letsencrypt"

  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: latitude
      POSTGRES_PASSWORD: examplepassword
      POSTGRES_DB: latitude
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - internal

  redis:
    image: redis:7
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis-data:/data
    networks:
      - internal

volumes:
  postgres-data:
  redis-data:

networks:
  web:
    external: false
  internal:
    external: false
