# RelationMap

Local-first Notion relationship graph web app (read-only).

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NOTION_TOKEN=secret_xxx
NOTION_ROOT_PAGE=https://www.notion.so/your-root-page-id
```

3. Run a sync:

```bash
npm run sync
```

4. Start app:

```bash
npm run dev
```
If env vars are missing (or no databases are found), the app returns an empty graph and shows warnings. It does not generate demo data.

## API

- `GET /api/graph`
- `GET /api/node/:id`
- `POST /api/sync`
- `GET /api/config`

## Next Steps

- Replace basic SVG renderer with Sigma.js.
- Add editable color settings and save to `data/config.json`.
- Add nightly scheduler (`node-cron` or OS cron).
