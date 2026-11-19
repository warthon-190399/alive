import { readFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA_DIR } from "@/db";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".avif": "image/avif", ".svg": "image/svg+xml",
};

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const abs = path.resolve(MEDIA_DIR, ...parts);
  if (!abs.startsWith(path.resolve(MEDIA_DIR) + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(abs);
    const type = TYPES[path.extname(abs).toLowerCase()] ?? "application/octet-stream";
    const headers: Record<string, string> = { "content-type": type, "cache-control": "private, max-age=31536000, immutable" };
    if (type === "image/svg+xml") headers["content-security-policy"] = "default-src 'none'; style-src 'unsafe-inline'";
    return new Response(data, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
