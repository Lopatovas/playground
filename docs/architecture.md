# Architecture Documentation

## System Overview

The Adaptive Competitor Intelligence System is a five-layer pipeline that transforms raw public web content into actionable competitive signals. Users add competitors, the system automatically discovers and monitors sources, extracts structured signals, and delivers a ranked intelligence feed.

```mermaid
graph TB
    subgraph User Layer
        UI[React Frontend]
    end

    subgraph API Layer
        API[NestJS API Server]
    end

    subgraph Processing Layer
        BQ[BullMQ Job Queues]
        W1[Discovery Worker]
        W2[Ingestion Worker]
        W3[Signal Extraction Worker]
    end

    subgraph Data Layer
        PG[(PostgreSQL)]
        RD[(Redis)]
    end

    subgraph External
        SX[SearXNG Meta-Search]
        WEB[Public Websites]
        LLM[LLM / Mistral]
    end

    UI -->|HTTP/JSON| API
    API -->|Read/Write| PG
    API -->|Enqueue Jobs| BQ
    BQ -->|Stored in| RD
    BQ --> W1 & W2 & W3
    W1 -->|Search Queries| SX
    SX -->|Results| W1
    W1 -->|Save Sources| PG
    W2 -->|Fetch HTML| WEB
    W2 -->|Save Documents| PG
    W3 -->|Analyze Text| LLM
    W3 -->|Save Signals| PG
```

---

## Layer Architecture

The system is organized into five conceptual layers, each mapped to NestJS modules:

```mermaid
graph LR
    subgraph "1. Entity Layer"
        E[Entities Module]
        C[Competitors]
    end

    subgraph "2. Source Discovery Layer"
        SD[Sources Module]
        SX[SearXNG]
    end

    subgraph "3. Ingestion Layer"
        IN[Ingestion Module]
    end

    subgraph "4. Signal Extraction Layer"
        SE[Signals Module]
        LLM[LLM Module]
    end

    subgraph "5. Intelligence Layer"
        FD[Feed Module]
        FB[Feedback Module]
    end

    E --> SD
    SD --> IN
    IN --> SE
    SE --> FD
    FB --> FD
```

| Layer | Module | Responsibility |
|-------|--------|---------------|
| **Entity** | `entities/` | Manage companies and competitor relationships |
| **Source Discovery** | `sources/` | Find and validate web sources per entity |
| **Ingestion** | `ingestion/` | Fetch HTML, extract clean text, store documents |
| **Signal Extraction** | `signals/` + `llm/` | Analyze documents for meaningful changes |
| **Intelligence** | `feed/` + `feedback/` | Rank, filter, and deliver signals to users |

---

## Data Pipeline Flow

This is the core pipeline that transforms a competitor name into actionable intelligence:

```mermaid
flowchart TD
    A[User adds competitor] --> B[Entity created in DB]
    B --> C{Discovery triggered}
    C -->|Automatic| D[BullMQ: source-discovery queue]
    C -->|Manual| D
    D --> E[Build search queries]
    E --> F[Query SearXNG]
    F --> G[Parse results]
    G --> H{For each result}
    H --> I[Infer source type]
    I --> J[Deduplicate by URL]
    J --> K[Save Source to DB]
    K --> L[BullMQ: ingestion queue]
    L --> M[Fetch HTML from URL]
    M --> N[Cheerio: strip scripts/nav/footer]
    N --> O[Extract clean text]
    O --> P{Text > 50 chars?}
    P -->|Yes| Q[Save Document to DB]
    P -->|No| R[Skip]
    Q --> S[BullMQ: signal-extraction queue]
    S --> T[LLM analyzes text]
    T --> U{Signal types detected}
    U -->|Pricing keywords| V[PRICING_CHANGE signal]
    U -->|Feature keywords| W[FEATURE_LAUNCH signal]
    U -->|Hiring keywords| X[HIRING_SPIKE signal]
    U -->|Positioning keywords| Y[POSITIONING_CHANGE signal]
    V & W & X & Y --> Z[Save Signals to DB]
    Z --> AA[Mark Document as processed]
    AA --> AB[Signals appear in Feed]
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant DB as PostgreSQL

    U->>F: Enter email + password
    F->>A: POST /api/auth/register
    A->>DB: Check email uniqueness
    A->>A: bcrypt.hash(password, 10)
    A->>DB: INSERT user
    A->>A: JWT.sign({sub: userId, email})
    A-->>F: { accessToken, user }
    F->>F: Store token in localStorage

    Note over U,DB: Subsequent requests

    U->>F: Navigate to protected page
    F->>A: GET /api/entities (Authorization: Bearer <token>)
    A->>A: JwtStrategy.validate(payload)
    A->>DB: Find user by ID
    A-->>F: 200 OK + data
```

---

## Source Discovery Detail

The discovery system builds a per-entity source graph by generating targeted search queries and validating results.

```mermaid
flowchart LR
    subgraph "Query Generation"
        EN[Entity Name] --> Q1["'{name} pricing'"]
        EN --> Q2["'{name} product updates'"]
        EN --> Q3["'{name} blog'"]
        EN --> Q4["'{name} careers jobs'"]
        EN --> Q5["'{name} news'"]
        EN --> Q6["'{name} twitter'"]
        DOM[Entity Domain] --> Q7["'site:{domain} pricing OR blog'"]
    end

    subgraph "Search & Classify"
        Q1 & Q2 & Q3 & Q4 & Q5 & Q6 & Q7 --> SX[SearXNG API]
        SX --> R[Top 5 results per query]
        R --> CL{Classify URL}
        CL -->|blog, medium.com| BLOG[BLOG]
        CL -->|news, techcrunch| NEWS[NEWS]
        CL -->|careers, lever.co| JOBS[JOBS]
        CL -->|twitter, linkedin| SOCIAL[SOCIAL]
        CL -->|default| WEB[WEBSITE]
    end

    subgraph "Validation"
        BLOG & NEWS & JOBS & SOCIAL & WEB --> DD[Deduplicate by entity+URL]
        DD --> DB[(Sources Table)]
    end
```

Source discovery can be triggered in three ways:
1. **Automatic** — BullMQ `source-discovery` queue processes entities on creation
2. **Manual API** — `POST /api/sources/discover?entityId=`
3. **User suggestion** — `POST /api/sources/suggest` with a specific URL

---

## Ingestion Pipeline Detail

```mermaid
flowchart TD
    S[(Source record)] --> F[Fetch URL via Axios]
    F --> |15s timeout, custom UA| H{HTTP Response}
    H -->|Success| C[Load HTML into Cheerio]
    H -->|Failure| SK[Skip, log warning]
    C --> R[Remove: script, style, nav, footer, header, iframe, noscript]
    R --> T[Extract body text]
    T --> N[Normalize whitespace]
    N --> L{Length check}
    L -->|≥ 50 chars| D[Create Document record]
    L -->|< 50 chars| SK2[Skip — not enough content]
    D --> U[Update Source.lastCheckedAt]
    D --> Q[Enqueue for signal extraction]

    style SK fill:#fee,stroke:#f66
    style SK2 fill:#fee,stroke:#f66
```

Key design decisions:
- **50-char minimum** prevents storing empty or boilerplate-only pages
- **50,000-char cap** prevents storing massive pages that would slow LLM processing
- **Non-content elements stripped** before text extraction for cleaner signal analysis
- **`lastCheckedAt` tracking** enables schedule-based re-ingestion

---

## Signal Extraction Detail

```mermaid
flowchart TD
    D[(Unprocessed Document)] --> L{LLM Provider}
    L -->|stub| KW[Keyword Matching Engine]
    L -->|mistral| MI[Mistral API Call]

    KW --> PC{price, pricing, cost, plan?}
    KW --> FL{launch, release, new feature, update?}
    KW --> HS{hiring, careers, job opening?}
    KW --> PS{rebrand, mission, vision, positioning?}

    PC -->|Yes| S1["PRICING_CHANGE
    confidence: 0.60"]
    FL -->|Yes| S2["FEATURE_LAUNCH
    confidence: 0.65"]
    HS -->|Yes| S3["HIRING_SPIKE
    confidence: 0.55"]
    PS -->|Yes| S4["POSITIONING_CHANGE
    confidence: 0.50"]

    S1 & S2 & S3 & S4 --> SV[Save Signal with evidence JSON]
    SV --> MK[Mark document processed=true]
```

Each signal contains:
- **type** — One of the four signal categories
- **summary** — Human-readable description
- **confidence** — 0.0–1.0 score (stub uses fixed values; LLM will produce dynamic scores)
- **evidence** — JSON with matched keywords and a text snippet for auditability

---

## Feed Ranking Algorithm

The intelligence feed ranks signals by a composite relevance score:

```mermaid
flowchart LR
    subgraph "Relevance Score Computation"
        C[Signal Confidence] --> |base score| SC[Score]
        R[Recency] --> |max 0.3 boost| SC
        F[Net Feedback] --> |±0.1 per vote| SC
        SC --> CL[Clamp to 0.0–1.0]
    end

    subgraph "Filtering"
        M[Muted Competitors] --> EX[Exclude from results]
        T[Signal Type Filter] --> FI[Apply if specified]
        D[Time Range] --> FI
    end

    CL --> SO[Sort descending by score]
    EX --> SO
    FI --> SO
    SO --> PG[Paginate: limit + offset]
```

**Relevance formula:**

```
score = confidence
      + recencyBoost * 0.3      // recencyBoost = max(0, 1 - ageHours / 168)
      + (relevant - irrelevant) * 0.1

score = clamp(score, 0.0, 1.0)
```

- **Confidence** is the base signal quality score from the LLM
- **Recency** provides up to a 0.3 boost for signals detected in the last 7 days, linearly decaying to 0
- **Feedback** adjusts score by ±0.1 per net upvote/downvote from users

---

## Background Job Architecture

```mermaid
graph TB
    subgraph "BullMQ Queues (Redis-backed)"
        Q1[source-discovery]
        Q2[ingestion]
        Q3[signal-extraction]
    end

    subgraph "Processors"
        P1[DiscoveryProcessor]
        P2[IngestionProcessor]
        P3[SignalExtractionProcessor]
    end

    subgraph "Triggers"
        T1[Entity created]
        T2[Source discovered]
        T3[Document ingested]
        T4[Manual API call]
        T5[Scheduled cron]
    end

    T1 & T4 & T5 --> Q1
    T2 & T4 --> Q2
    T3 & T4 --> Q3

    Q1 --> P1
    Q2 --> P2
    Q3 --> P3

    P1 -->|Calls| SS[SourcesService.discoverSources]
    P2 -->|Calls| IS[IngestionService.ingestSource]
    P3 -->|Calls| SES[SignalsService.extractFromDocument]
```

| Queue | Payload | Processor Logic |
|-------|---------|----------------|
| `source-discovery` | `{ entityId }` | Run search queries via SearXNG, save discovered sources |
| `ingestion` | `{ sourceId }` or `{ entityId }` | Fetch URL, clean HTML, store document |
| `signal-extraction` | `{ documentId }` or `{ entityId }` | Run LLM extraction, save signals, mark document processed |

---

## Database Schema (ERD)

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string passwordHash
        string company
        datetime createdAt
        datetime updatedAt
    }

    entities {
        uuid id PK
        string name
        string normalizedName
        string domain
        uuid userId FK
        datetime createdAt
        datetime updatedAt
    }

    competitors {
        uuid id PK
        uuid entityId FK
        uuid competitorEntityId FK
        boolean muted
        datetime mutedAt
        datetime createdAt
    }

    sources {
        uuid id PK
        uuid entityId FK
        enum type
        string url
        enum discoveryMethod
        float credibilityScore
        float signalDensity
        boolean isActive
        datetime lastCheckedAt
        datetime createdAt
    }

    documents {
        uuid id PK
        uuid sourceId FK
        uuid entityId FK
        string rawText
        string url
        datetime fetchedAt
        boolean processed
    }

    signals {
        uuid id PK
        uuid entityId FK
        uuid documentId FK
        enum type
        string summary
        float confidence
        json evidence
        datetime detectedAt
    }

    feedback {
        uuid id PK
        uuid signalId FK
        uuid userId FK
        boolean relevant
        string comment
        datetime createdAt
    }

    users ||--o{ entities : owns
    users ||--o{ feedback : submits
    entities ||--o{ competitors : "has competitors"
    entities ||--o{ sources : "tracked by"
    entities ||--o{ documents : "ingested for"
    entities ||--o{ signals : "detected for"
    competitors }o--|| entities : "points to"
    sources ||--o{ documents : produces
    documents ||--o{ signals : generates
    signals ||--o{ feedback : receives
```

### Key Constraints

| Table | Unique Constraint | Purpose |
|-------|-------------------|---------|
| `users` | `email` | One account per email |
| `entities` | `(userId, normalizedName)` | No duplicate entities per user |
| `competitors` | `(entityId, competitorEntityId)` | No duplicate competitor links |
| `sources` | `(entityId, url)` | No duplicate source URLs per entity |
| `feedback` | `(signalId, userId)` | One feedback per user per signal (upsert) |

### Cascade Deletes

Deleting a **User** cascades to their entities. Deleting an **Entity** cascades to its sources, documents, signals, and competitor links. Deleting a **Signal** cascades to its feedback.

---

## User Journey

```mermaid
journey
    title User Journey: From Signup to Intelligence
    section Onboarding
        Sign up: 5: User
        Enter company name: 4: User
        Add first competitor: 4: User
    section Discovery (automated)
        System searches for sources: 5: System
        Sources saved to database: 5: System
        Sources listed in UI: 4: User
    section Daily Usage
        Ingestion runs on sources: 5: System
        Signals extracted from docs: 5: System
        View daily brief: 5: User
        Browse intelligence feed: 5: User
        Filter by signal type: 4: User
    section Feedback Loop
        Mark signal relevant: 4: User
        Mark signal irrelevant: 4: User
        Feed ranking improves: 5: System
        Suggest new source: 3: User
        Mute noisy competitor: 3: User
```

---

## Request Flow Example

Here's a complete trace of what happens when a user adds a competitor and eventually sees signals in their feed:

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as NestJS API
    participant DB as PostgreSQL
    participant RD as Redis/BullMQ
    participant WK as Workers
    participant SX as SearXNG
    participant WEB as Public Web
    participant LLM as LLM Service

    U->>FE: "Add Competitor: Acme Corp"
    FE->>API: POST /api/entities/{id}/competitors
    API->>DB: Create Entity "Acme Corp"
    API->>DB: Create Competitor relation
    API->>RD: Enqueue source-discovery job
    API-->>FE: 201 Created

    Note over WK,SX: Background processing

    RD->>WK: Pick up discovery job
    WK->>SX: Search "Acme Corp pricing"
    SX-->>WK: [acme.com/pricing, news.com/acme, ...]
    WK->>SX: Search "Acme Corp blog"
    SX-->>WK: [acme.com/blog, medium.com/acme, ...]
    WK->>DB: Save 10 discovered sources
    WK->>RD: Enqueue ingestion jobs

    RD->>WK: Pick up ingestion jobs
    WK->>WEB: GET acme.com/pricing
    WEB-->>WK: HTML response
    WK->>WK: Cheerio: clean HTML → text
    WK->>DB: Save Document
    WK->>RD: Enqueue signal-extraction job

    RD->>WK: Pick up extraction job
    WK->>LLM: "Analyze this text for signals"
    LLM-->>WK: [{type: PRICING_CHANGE, confidence: 0.8}]
    WK->>DB: Save Signal
    WK->>DB: Mark Document processed

    Note over U,FE: Later that day

    U->>FE: Open Dashboard
    FE->>API: GET /api/feed/daily-brief
    API->>DB: Query signals (exclude muted, rank by relevance)
    API-->>FE: {sections: [{type: PRICING_CHANGE, items: [...]}]}
    FE-->>U: "Acme Corp: Pricing change detected"

    U->>FE: Click "Relevant" on signal
    FE->>API: POST /api/feedback {signalId, relevant: true}
    API->>DB: Upsert feedback
    API-->>FE: 201 OK
```

---

## Technology Stack

```mermaid
graph LR
    subgraph Frontend
        RE[React 19] --> VI[Vite 8]
        RE --> TW[Tailwind CSS 4]
        RE --> RR[React Router 7]
        RE --> AX1[Axios]
    end

    subgraph Backend
        NE[NestJS 11] --> PR[Prisma 7]
        NE --> PP[Passport JWT]
        NE --> BM[BullMQ 5]
        NE --> AX2[Axios]
        NE --> CH[Cheerio]
        PR --> PGA[@prisma/adapter-pg]
    end

    subgraph Infrastructure
        PG[(PostgreSQL 16)]
        RD[(Redis 7)]
        SX[SearXNG]
    end

    VI -->|Proxy /api| NE
    PGA --> PG
    BM --> RD
    NE -->|HTTP| SX
```

---

## Module Dependency Graph

```mermaid
graph TD
    APP[AppModule] --> CFG[ConfigModule]
    APP --> BULL[BullModule]
    APP --> PRI[PrismaModule]
    APP --> AUTH[AuthModule]
    APP --> ENT[EntitiesModule]
    APP --> SRC[SourcesModule]
    APP --> ING[IngestionModule]
    APP --> LLM[LlmModule]
    APP --> SIG[SignalsModule]
    APP --> FD[FeedModule]
    APP --> FB[FeedbackModule]
    APP --> JOB[JobsModule]

    AUTH --> PRI
    AUTH --> CFG
    ENT --> PRI
    SRC --> PRI
    SRC --> CFG
    ING --> PRI
    LLM --> CFG
    SIG --> PRI
    SIG --> LLM
    FD --> PRI
    FB --> PRI

    JOB --> SRC
    JOB --> ING
    JOB --> SIG
    JOB --> BULL

    PRI -.->|Global| AUTH & ENT & SRC & ING & SIG & FD & FB
    CFG -.->|Global| AUTH & SRC & LLM

    style PRI fill:#e8f5e9,stroke:#4caf50
    style CFG fill:#e8f5e9,stroke:#4caf50
```

`PrismaModule` and `ConfigModule` are registered as global modules — all other modules can inject `PrismaService` and `ConfigService` without explicit imports.

---

## Observability

### Structured Logging (Pino)

All HTTP requests and application events are logged via [nestjs-pino](https://github.com/iamolegga/nestjs-pino) with structured JSON output.

**Development** (pretty-printed, colorized, single-line):

```
[18:47:08] INFO: request completed {"req":{"method":"POST","url":"/api/auth/login"},"res":{"statusCode":201},"responseTime":52}
```

**Production** (raw JSON for log aggregation):

```json
{"level":30,"time":1717264028000,"msg":"request completed","req":{"method":"POST","url":"/api/auth/login"},"res":{"statusCode":201},"responseTime":52}
```

Configuration via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Minimum log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `NODE_ENV` | `development` | Set to `production` for raw JSON output (no pretty-printing) |

Health check (`/health`) and Bull Board admin requests are excluded from request logging to reduce noise.

### Swagger API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

```mermaid
graph LR
    DEV[Developer] -->|Browse| SW["/api/docs — Swagger UI"]
    SW --> AUTH[Auth endpoints]
    SW --> ENT[Entity endpoints]
    SW --> SRC[Source endpoints]
    SW --> SIG[Signal endpoints]
    SW --> FEED[Feed endpoints]
    SW --> FB[Feedback endpoints]
    AUTH -->|"Try it out"| API[NestJS Backend]
```

Features:
- **Try it out** — Execute API calls directly from the browser
- **Persistent authorization** — Enter a JWT token once and it persists across requests
- **Schema exploration** — View request/response schemas with examples for every DTO
- **Grouped by tags** — Auth, Entities, Sources, Signals, Feed, Feedback

### Bull Board (Queue Monitoring)

BullMQ job queues are monitored via [Bull Board](https://github.com/felixmosh/bull-board) at `/admin/queues`.

```mermaid
graph TB
    subgraph "Bull Board Dashboard"
        SD["source-discovery queue"]
        IN["ingestion queue"]
        SE["signal-extraction queue"]
    end

    SD --> |View| SDM["Active / Waiting / Completed / Failed jobs"]
    IN --> |View| INM["Active / Waiting / Completed / Failed jobs"]
    SE --> |View| SEM["Active / Waiting / Completed / Failed jobs"]

    SDM --> R[Retry failed jobs]
    INM --> R
    SEM --> R
```

Capabilities:
- **Real-time view** of active, waiting, completed, and failed jobs per queue
- **Job details** — Inspect payload, return value, error stack traces
- **Retry/remove** — Manually retry failed jobs or clean completed ones
- **Progress tracking** — See job progress for long-running operations
