import path from "node:path";

import { NextResponse } from "next/server";

import { NODES_DIR } from "@/lib/config";
import { readJsonFile } from "@/lib/storage";
import type { NodeDetail } from "@/lib/types";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const filePath = path.join(NODES_DIR, `${id}.json`);
  const detail = await readJsonFile<NodeDetail>(filePath);

  if (!detail) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
