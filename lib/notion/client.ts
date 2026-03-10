const NOTION_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";
const REQUEST_TIMEOUT_MS = 30_000;

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function notionRequest<T>(
  method: "GET" | "POST",
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: controller.signal,
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Notion request timed out after ${REQUEST_TIMEOUT_MS}ms for ${method} ${path}`);
    }
    throw error;
  }).finally(() => {
    clearTimeout(timeout);
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}
