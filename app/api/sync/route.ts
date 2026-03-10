import { NextResponse } from "next/server";

import { runSync } from "@/lib/notion/sync";

export async function POST() {
  try {
    const graph = await runSync();
    return NextResponse.json({
      ok: true,
      generatedAt: graph.generatedAt,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 },
    );
  }
}
