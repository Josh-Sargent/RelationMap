import { NextResponse } from "next/server";

import { GRAPH_FILE } from "@/lib/config";
import { readJsonFile } from "@/lib/storage";
import { runSync } from "@/lib/notion/sync";
import type { GraphData } from "@/lib/types";

export async function GET() {
  let graph = await readJsonFile<GraphData>(GRAPH_FILE);
  if (!graph) {
    graph = await runSync();
  }

  return NextResponse.json(graph);
}
