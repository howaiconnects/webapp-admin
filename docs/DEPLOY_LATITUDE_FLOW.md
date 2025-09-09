# Latitude Deployment Request Flow

The diagram below shows the request and data flow for the Latitude deployment behind Traefik on the Azure VM.

```mermaid
flowchart LR
  Client -->|HTTPS request| Traefik[Traefik reverse proxy]
  Traefik -->|route Host header latitude.totallybot.com| Latitude[Latitude service]
  Latitude -->|reads/writes| Postgres[(Postgres)]
  Latitude -->|cache / sessions| Redis[(Redis)]
  Latitude -->|vector db requests| Qdrant[(Qdrant)]
  Traefik -. SSH tunnel .-> TraefikLocal[Traefik dashboard bound to localhost]
  Admin -. SSH tunnel .-> TraefikLocal
  note right of TraefikLocal: Dashboard accessible only via SSH tunnel (127.0.0.1:8080)
  note right of Traefik: Traefik listens on 0.0.0.0:80 and 0.0.0.0:443 for ACME challenges
```

Usage notes
- The Traefik dashboard is intentionally bound to localhost (127.0.0.1:8080). Access it via SSH tunnel:
  - ssh -L 8080:127.0.0.1:8080 your-user@68.220.176.9
  - Open http://localhost:8080/dashboard/
- Ensure Postgres, Redis, and Qdrant are not exposed publicly and are only reachable by the internal Docker network or via private network configurations.
