import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const entries = ["index.html", "admin.html", "app.js", "styles.css", "assets"];

for (const entry of entries) {
  const from = path.join(root, entry);
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, path.join(dist, entry), { recursive: true });
}

console.log("Static build complete ->", dist);
