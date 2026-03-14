import { NextResponse } from "next/server";

import { CONFIG_FILE } from "@/lib/config";
import { readJsonFile, writeJsonAtomic } from "@/lib/storage";
import type { AppConfig } from "@/lib/types";

export async function GET() {
  const config = (await readJsonFile<AppConfig>(CONFIG_FILE)) ?? { databaseColors: {} };
  return NextResponse.json({
    notionToken: config.notionToken ?? "",
    rootPages: config.rootPages ?? [],
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const notionToken: string = typeof body.notionToken === "string" ? body.notionToken.trim() : "";
  const rootPages: string[] = Array.isArray(body.rootPages)
    ? body.rootPages.filter((p: unknown) => typeof p === "string" && p.trim()).map((p: string) => p.trim())
    : [];

  const existing = (await readJsonFile<AppConfig>(CONFIG_FILE)) ?? { databaseColors: {} };
  await writeJsonAtomic(CONFIG_FILE, {
    ...existing,
    notionToken,
    rootPages,
  } satisfies AppConfig);

  return NextResponse.json({ ok: true });
}
