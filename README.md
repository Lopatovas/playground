# AI Data Readiness Scanner

A Dockerized Nest.js + React prototype for auditing whether CSV/XLSX business datasets are ready for AI usage.

The scanner produces:

- an overall AI readiness score from 0-100
- sub-scores for data quality, privacy/compliance, schema clarity, AI usability and monitoring readiness
- deterministic, traceable findings
- a prioritized action plan
- recurring scan comparison against previous scans for the same dataset name
- persisted scan state with PostgreSQL and Prisma
- queued scan processing with BullMQ and Redis
- BullMQ queue dashboard
- Swagger/OpenAPI documentation
- an LLM adapter layer with Mistral as the first provider

## Run with Docker

```bash
cp .env.sample .env
docker compose up --build
```

Open:

- Web app: http://localhost:8080
- API health: http://localhost:3000/health
- Swagger docs: http://localhost:3000/docs
- BullMQ dashboard: http://localhost:3000/queues

The Mistral API key is optional. Without it, the app uses deterministic report text. With `MISTRAL_API_KEY` set, Mistral can rewrite the summary/action plan using only aggregate findings, not raw uploaded rows.

## Local development

```bash
npm install
# Start Postgres and Redis locally, or use Docker Compose.
npm run prisma:db:push -w @ai-readiness/api
npm run dev:api
npm run dev:web
```

## Documentation

- [Architecture](docs/architecture.md)
- [Database and data model](docs/database-structure.md)
- [Tenant isolation](docs/tenant-isolation.md)
- [Scoring system and algorithm](docs/scoring.md)
- [Sample inputs and expected findings](docs/sample-inputs.md)
- [API usage](docs/api.md)
- [TODO / roadmap](docs/todo.md)

## Architecture

```text
React web app
  -> Nest.js API
    -> file parser (CSV/XLSX)
    -> Postgres/Prisma persisted queued scan
    -> BullMQ/Redis worker
    -> deterministic profiler
    -> risk detector
    -> scoring engine
    -> report generator
    -> LLM adapter (Mistral first)
```

Raw uploaded rows are analyzed inside the API. The LLM adapter receives aggregate profiles, findings and score data only.
