# HowAIConnects – Phased Integration Roadmap  
_Last updated: 2025-09-05_

---

## Overview

This roadmap delivers the AI-first pipeline in **three focused phases**.  
Each phase is time-boxed, has clear exit criteria, and directly uplifts KPIs outlined in the Architecture Report.

```mermaid
gantt
  title HowAIConnects – 12-Week Integration Timeline
  dateFormat  YYYY-MM-DD
  section Phase 1
  Env Audit & Config Std.:active, p1a, 2025-09-08, 10d
  Dedupe & Asset Patch      :p1b, after p1a, 7d
  Metrics Scaffolding       :p1c, after p1a, 7d
  section Phase 2
  Miro AI Module            :p2a, 2025-09-25, 14d
  PromptLab Adapters        :p2b, after p2a, 14d
  Supabase Schema Upgrade   :p2c, parallel p2b, 10d
  section Phase 3
  Event Pipeline E2E        :p3a, 2025-10-23, 10d
  Prod Hardening            :p3b, after p3a, 10d
  KPI Validation            :p3c, after p3b, 5d
```

---

## Phase 1 — Discovery & Preparation _(Weeks 1-4)_

| Objective | Task | Owner | Success Criteria |
|-----------|------|-------|------------------|
| Unified configuration | Produce canonical `.env.example`, Zod validator | Dev Ops | All services start with `pnpm dev` |
| Data quality | Run duplicate-resolver + asset-patch scripts | Platform Eng | 0 duplicates; 0 missing required assets |
| Observability baseline | Deploy Prometheus + Grafana stack | SRE | Dashboards live; scrape all core services |

Risks & Mitigation  
* _Risk_: Hidden template mismaps → **Mitigation**: SHA-256 re-hash check in CI.  
* _Risk_: Secrets drift → **Mitigation**: Hashicorp Vault integration proposal (out of scope this quarter).

---

## Phase 2 — Import & Standardise _(Weeks 4-8)_

### Key Deliverables

1. **Miro AI Developer API Module**  
   * Node client package `packages/miro-adapter/`  
   * OAuth flow + webhook receiver in API-Gateway

2. **PromptLab Adapter Completion**  
   * Latitude, Airtable, CrewAI parity (`packages/prompt-lab/…`)  
   * Versioned prompt CRUD tests reach >90 % coverage

3. **Supabase / Postgres Schema Upgrade**  
   * Consolidated `prisma/schema.prisma` with tenant-aware RLS

Dependencies  
* Supabase hardening depends on env-audit (Phase 1).  
* PromptLab relies on adapter scaffolds that already exist.

---

## Phase 3 — Integrate & Test _(Weeks 8-12)_

| Deliverable | Detail | KPI Target |
|-------------|--------|------------|
| **Event-Driven Ingest** | CrawlComplete → Webhook → Worker → Qdrant/Blob/Postgres | Processing latency < 30 s |
| **End-to-End Tests** | Playwright suite from crawl job creation to semantic search | E2E pass rate > 95 % |
| **Production Hardening** | RLS policies, rate limiting, Grafana alerts, cost guardrails | API uptime 99.9 % (30-day rolling) |

---

## Cross-Phase Dependency Matrix

| Component | P1 | P2 | P3 |
|-----------|----|----|----|
| Config Standardisation | ✔ | — | — |
| PromptLab Core | — | ✔ | ✔ |
| Bright Data Cost Controls | ✔ | ✔ | ✔ |
| Monitoring Stack | ✔ | ✔ | ✔ |

---

## Resource & Budget Plan

* **Engineering**: 2 FE, 2 BE, 1 DevOps, 0.5 PM  
* **Bright Data**: \$1,000/mo cap with 20 % burst spillover  
* **Azure / Supabase**: scaled to < \$300/mo for dev

---

## Success Metrics

| Metric | Phase 1 Baseline | Phase 3 Goal |
|--------|------------------|--------------|
| Crawl Success Rate | 87 % | ≥ 95 % |
| Processing Latency | 55 s | ≤ 30 s |
| API Uptime | 98.4 % | ≥ 99.9 % |
| Documentation Coverage | 74 % | ≥ 95 % |
| Cost / 1 k Pages | \$1.45 | ≤ \$0.90 |

---

## Validation & Sign-off

* **Exit review** after each phase with KPI snapshot.  
* Final stakeholder demo at week 12 showcasing:  
  * Miro board ingestion → PromptLab prompt refinement → Semantic search in Web App.
