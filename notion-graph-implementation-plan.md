# Notion Graph Web App Implementation Plan

## Project Goal
Build a local-first, read-only web app that visualizes Notion data as an Obsidian-style graph.

## Confirmed Decisions
- Deployment: laptop local-first (self-hosted)
- Frontend/backend stack: Next.js + TypeScript
- Graph library: Sigma.js + Graphology
- Auth model: single Notion integration token
- Sync cadence: nightly (overnight, once/day)
- Data scale target: ~1,000 pages
- Performance target: initial load at or under 5 seconds
- Editing mode: read-only
- Node click behavior: show details + link out to Notion
- Required node detail fields:
  - name
  - created by
  - created date
  - Notion page URL
- Color customization:
  - at least per-database colors

## Why This Architecture
- TypeScript keeps frontend and backend in one language.
- Next.js gives a polished web app foundation with API routes.
- File-based storage avoids database setup while still supporting your scale.
- Precomputed graph artifacts make morning load fast after nightly sync.
- Clean upgrade path to Postgres later without redoing UI or graph logic.

## V1 Architecture

### 1) App Layer
- Next.js App Router for UI and API in one project
- React client UI for graph interactions and detail panel
- Tailwind and custom theme tokens for a polished design system

### 2) Data Ingestion Layer
- Notion API client in TypeScript
- Crawl configured Notion roots/data sources
- Extract nodes, relations, and detail fields
- Normalize and deduplicate graph entities

### 3) Graph Build Layer
- Transform raw Notion records into:
  - graph summary (`nodes`, `edges`, layout positions, color mapping)
  - node detail payloads for click panel
- Precompute positions during sync for faster load

### 4) Storage Layer (No DB)
- JSON files under `data/`:
  - `data/graph.json`
  - `data/config.json`
  - `data/nodes/<node-id>.json`

### 5) Runtime API Layer
- `GET /api/graph` returns graph summary payload
- `GET /api/node/:id` returns one node detail payload
- `POST /api/sync` runs manual sync

### 6) Scheduler Layer
- Nightly sync job at 2:00 AM local time
- Option A: app-managed with `node-cron`
- Option B: OS cron calling sync script

## Target Project Structure

```text
RelationMap/
  app/
    page.tsx
    api/
      graph/route.ts
      node/[id]/route.ts
      sync/route.ts
  components/
    GraphCanvas.tsx
    NodeDetailsPanel.tsx
    ColorSettings.tsx
  lib/
    notion/
      client.ts
      sync.ts
    graph/
      build.ts
      layout.ts
    config.ts
  scripts/
    run-sync.ts
  data/
    graph.json
    config.json
    nodes/
  notion-graph-implementation-plan.md
```

## Data Contracts

### Node (graph payload)
- `id: string`
- `name: string`
- `databaseId: string`
- `databaseName: string`
- `color: string`
- `notionUrl: string`
- `createdBy: string`
- `createdTime: string` (ISO 8601)
- `x: number`
- `y: number`

### Edge (graph payload)
- `id: string` (stable hash of source+target+relation)
- `source: string`
- `target: string`
- `relationName: string`

### Node Detail (panel payload)
- `id: string`
- `name: string`
- `createdBy: string`
- `createdTime: string`
- `databaseName: string`
- `notionUrl: string`

### Config
- `databaseColors: Record<string, string>`
- optional future keys:
  - `rootPageIds`
  - `includedDataSourceIds`
  - `lastSyncAt`

## API and Sync Flow

### Nightly Sync
1. Read token and sync config.
2. Fetch Notion data (pages + relation properties).
3. Build normalized graph.
4. Compute deterministic layout positions.
5. Write `data/graph.json` and per-node detail JSON files.
6. Update `data/config.json` sync metadata.

### Runtime Read Path
1. Frontend loads graph from `/api/graph`.
2. Sigma renders nodes/edges from precomputed payload.
3. User clicks node.
4. Frontend requests `/api/node/:id`.
5. Detail panel shows required fields and Notion link.

## UX Requirements (V1)
- Obsidian-like graph visualization
- Smooth zoom/pan/select
- Node neighbor highlighting on selection
- Search nodes by name
- Right-side detail panel on node click
- Link button to open node in Notion (new tab)
- Legend showing database names and colors
- Color settings by database

## Performance Plan (<5s load target)
- Precompute node positions during sync
- Keep graph payload compact and JSON-only
- Use WebGL renderer via Sigma
- Lazy-load detail payloads on click
- Enable response compression
- Avoid fetching full page details on initial page load

## Reliability and Safety
- Retry with backoff for Notion API rate limits/transient errors
- Structured sync logs (duration, counts, failures)
- Atomic writes for `graph.json` (write temp file then rename)
- Input validation for color settings and payload schema
- Read-only design (no mutation calls to Notion content)

## Milestones and Timeline

### Phase 1: Foundation (Day 1-2)
- Scaffold Next.js TypeScript app
- Set up Tailwind and design tokens
- Implement Notion client and environment config
- Define graph and detail TypeScript types

### Phase 2: Data Pipeline (Day 3-4)
- Implement sync logic from Notion
- Build graph normalization and dedupe
- Write file-based artifacts (`graph.json`, `nodes/*.json`)
- Add initial manual sync route and script

### Phase 3: Graph UI (Day 5-6)
- Implement Sigma canvas and interactions
- Add node selection/highlight/search
- Add detail panel with required fields and Notion link
- Add loading/error/empty states

### Phase 4: Settings + Scheduler (Day 7)
- Implement per-database color settings UI
- Persist color config in `data/config.json`
- Implement nightly scheduler (2:00 AM local)

### Phase 5: Polish + Hardening (Day 8)
- Visual polish pass (typography, spacing, panel quality)
- Optimize bundle and payload size
- Add sync status and diagnostics
- Final testing and runbook documentation

## Test Plan

### Unit Tests
- Notion ID extraction and URL parsing
- Graph deduplication and edge ID stability
- Color mapping validation
- Date/user field mapping for detail payloads

### Integration Tests
- End-to-end sync with mocked Notion responses
- API route contract tests (`/api/graph`, `/api/node/:id`)
- Scheduler invocation test

### Manual Acceptance Tests
- Load graph with ~1,000 pages under target time
- Click node shows correct name/creator/created date/link
- Open-in-Notion works
- Per-database color changes persist and reflect in graph
- Nightly sync updates graph data by next morning

## Future Upgrade Path (Post-V1)
- Replace file storage with Postgres when needed
- Add user auth and per-user Notion OAuth for multi-user deployment
- Add hosted deployment path (VPS/cloud)
- Add richer filters and saved views

## Open Follow-Ups for Build Start
- Confirm root Notion page(s) or data source IDs for first sync target
- Confirm date display format in UI (relative vs absolute)
- Confirm scheduler implementation preference (`node-cron` vs OS cron)
