# Adaptive Competitor Intelligence System

A system for tracking competitor activities through automated source discovery, content ingestion, and signal extraction.

## Architecture

- **Backend**: NestJS + TypeScript + Prisma ORM + BullMQ
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Search**: SearXNG (self-hosted meta-search engine)
- **LLM**: Stubbed (Mistral-ready interface)

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and SearXNG.

### 2. Setup backend

```bash
cd backend
cp .env.example .env    # already configured for Docker defaults
npm install
npx prisma migrate dev  # run migrations
npm run start:dev
```

Backend runs on http://localhost:3000

### 3. Setup frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 (proxies API calls to backend)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get current user |
| GET/POST | `/api/entities` | List/create entities |
| POST | `/api/entities/:id/competitors` | Add competitor |
| DELETE | `/api/entities/:id/competitors/:cid` | Remove competitor |
| PATCH | `/api/entities/:id/competitors/:cid/mute` | Mute/unmute |
| GET | `/api/sources?entityId=` | List sources |
| POST | `/api/sources/suggest` | Suggest a source |
| POST | `/api/sources/discover?entityId=` | Trigger source discovery |
| GET | `/api/signals` | List signals (filterable) |
| POST | `/api/signals/extract` | Extract signals from documents |
| GET | `/api/feed` | Intelligence feed (ranked) |
| GET | `/api/feed/daily-brief` | Daily brief grouped by type |
| POST | `/api/feedback` | Submit signal feedback |

## Testing

```bash
cd backend
npm test
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT authentication
│   │   ├── entities/      # Entity + competitor management
│   │   ├── sources/       # Source discovery (SearXNG)
│   │   ├── ingestion/     # HTML fetch + clean + store
│   │   ├── llm/           # LLM service (stubbed/Mistral)
│   │   ├── signals/       # Signal extraction
│   │   ├── feed/          # Intelligence feed + ranking
│   │   ├── feedback/      # Relevance feedback
│   │   ├── jobs/          # BullMQ processors
│   │   ├── prisma/        # Database service
│   │   └── common/        # Shared decorators/guards
│   └── prisma/
│       └── schema.prisma  # Database schema
├── frontend/
│   └── src/
│       ├── api/           # API client
│       ├── components/    # Reusable components
│       ├── hooks/         # Auth context
│       └── pages/         # Route pages
└── docker-compose.yml
```
