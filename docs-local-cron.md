# Nightly Sync (Laptop)

## Option A: macOS `cron`

1. Open crontab:

```bash
crontab -e
```

2. Add this line for 2:00 AM local:

```bash
0 2 * * * cd /Users/josh.sargent/Development/RelationMap && /usr/bin/env npm run sync >> /Users/josh.sargent/Development/RelationMap/data/sync.log 2>&1
```

3. Verify:

```bash
crontab -l
```

## Option B: Manual daily run

```bash
cd /Users/josh.sargent/Development/RelationMap
npm run sync
```
