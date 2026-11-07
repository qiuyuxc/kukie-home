import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const publicRoot = process.argv.includes("--dist") ? resolve(projectRoot, "dist") : projectRoot;
const port = Number(process.env.PREVIEW_PORT || 8096);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function serveNotFound(response, method) {
  try {
    const content = await readFile(resolve(publicRoot, "404.html"));
    response.writeHead(404, { "Content-Type": types[".html"], "Content-Length": content.length });
    response.end(method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404);
    response.end(method === "HEAD" ? undefined : "Not found");
  }
}

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  let path;
  try { path = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400); response.end("Bad request"); return; }
  const file = resolve(publicRoot, "." + (path === "/" ? "/index.html" : path));
  const type = types[extname(file)];
  if (!file.startsWith(publicRoot + sep) || !type) {
    await serveNotFound(response, request.method);
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("Not a file");
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": type, "Content-Length": content.length });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    await serveNotFound(response, request.method);
  }
});
server.listen(port, "0.0.0.0", () => {
  console.log("Kukie 首页预览：http://127.0.0.1:" + port);
});
server.on("error", error => { console.error(error.message); process.exitCode = 1; });
process.on("SIGINT", () => server.close(() => process.exit(0)));
