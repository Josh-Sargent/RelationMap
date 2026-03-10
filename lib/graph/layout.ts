import crypto from "node:crypto";

export function stablePosition(nodeId: string): { x: number; y: number } {
  const digest = crypto.createHash("md5").update(nodeId).digest("hex");
  const xSeed = Number.parseInt(digest.slice(0, 8), 16);
  const ySeed = Number.parseInt(digest.slice(8, 16), 16);

  return {
    x: (xSeed % 1600) - 800,
    y: (ySeed % 1200) - 600,
  };
}
