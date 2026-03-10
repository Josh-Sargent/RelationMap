import { loadEnvConfig } from "@next/env";

import { runSync } from "@/lib/notion/sync";

async function main() {
  loadEnvConfig(process.cwd());
  const graph = await runSync();
  console.log(`Sync complete at ${graph.generatedAt}`);
  console.log(`Nodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);
  if (graph.warnings?.length) {
    for (const warning of graph.warnings) {
      console.warn(`Warning: ${warning}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
