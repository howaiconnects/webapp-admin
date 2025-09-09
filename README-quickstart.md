# How AI Connects - Quick Start (10 Minutes)

Get the How AI Connects webapp running locally in under 10 minutes using Docker Compose.

## Prerequisites

- **Docker & Docker Compose** installed on your system
  - [Install Docker](https://docs.docker.com/get-docker/)
  - [Install Docker Compose](https://docs.docker.com/compose/install/)

## Quick Setup Steps

### 1. Clone the Repository (1 minute)
```bash
git clone <repository-url>
cd howaiconnects-webapp
```

### 2. Set Up Environment Variables (2 minutes)
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the file with your API keys and configuration
# Required: Add your actual API keys for external services
nano .env.local  # or use your preferred editor
```

**Required Environment Variables to Configure:**
- `AIRTABLE_API_KEY` - Your Airtable API key
- `MIRO_CLIENT_ID` & `MIRO_CLIENT_SECRET` - Miro OAuth credentials
- `OPENAI_API_KEY` - OpenAI API key (optional, for LLM features)
- Other service-specific keys as needed

### 3. Start the Development Environment (2 minutes)
```bash
# Start all services (Next.js app, Supabase, Redis)
docker-compose up --build
```

Wait for the containers to build and start. You'll see:
- ✅ Next.js app running on http://localhost:3000
- ✅ Supabase (PostgreSQL) on port 5432
- ✅ Redis on port 6379

### 4. Access the Application (30 seconds)
Open your browser and navigate to: **http://localhost:3000**

## Services Included

- **webapp-admin**: Next.js 15 application (TypeScript)
- **supabase**: PostgreSQL database with Supabase CLI
- **redis**: Redis for caching and queues
- **qdrant**: Vector database (optional)

## Development Workflow

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose up
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f webapp-admin
```

### Rebuild After Code Changes
```bash
docker-compose up --build
```

## Troubleshooting

### Port Conflicts
If ports 3000, 5432, or 6379 are already in use:
```bash
# Stop conflicting services or change ports in docker-compose.yml
docker-compose down
```

### Environment Variables Not Loading
Ensure `.env.local` exists in the project root and contains required values.

### Build Issues
```bash
# Clean rebuild
docker-compose down -v
docker-compose up --build --force-recreate
```

## What's Included

✅ Next.js 15 with TypeScript
✅ Supabase integration
✅ Redis caching
✅ All adapters (Miro, Latitude, Airtable)
✅ Unified dashboard
✅ Environment variable system

## Next Steps

- Explore the dashboard at http://localhost:3000
- Check the main README.md for detailed documentation
- Review architecture docs in `docs/` folder

---

**Time Estimate:** ~10 minutes for first setup, ~2 minutes for subsequent starts.