import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const output = resolve(projectRoot, "dist");
const files = [
  "index.html",
  "404.html",
  "styles.css",
  "site.js",
  "_headers",
  "LICENSE",
  "NOTICE",
  "THIRD_PARTY_NOTICES.txt",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  await copyFile(resolve(projectRoot, file), resolve(output, file));
}
await cp(resolve(projectRoot, "assets"), resolve(output, "assets"), { recursive: true });
console.log("已生成 dist/，可部署到 Cloudflare Pages。");
