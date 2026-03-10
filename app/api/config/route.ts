import { NextResponse } from "next/server";

import { CONFIG_FILE } from "@/lib/config";
import { readJsonFile } from "@/lib/storage";
import type { AppConfig } from "@/lib/types";

export async function GET() {
  const config = (await readJsonFile<AppConfig>(CONFIG_FILE)) ?? { databaseColors: {} };
  return NextResponse.json(config);
}
