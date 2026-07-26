/**
 * Next `output: "export"` emits both `route.html` and a `route/` directory of
 * RSC payload files. Plain static servers (tower ServeDir used by
 * `ledgerful web start --spa-dir`) treat `route/` as a directory: a request
 * for `/route` 307s to `/route/`, then looks for `route/index.html`. When that
 * file is missing they fall back to the SPA root `index.html`.
 *
 * That full document load:
 *   - wipes the in-memory auth token (0080), and
 *   - hydrates the wrong page shell.
 *
 * After export, for every `foo.html` that has a sibling directory `foo/`
 * without `index.html`, copy `foo.html` → `foo/index.html` so trailing-slash
 * URLs serve the correct page. Hashes of the HTML body are unchanged.
 */
import { copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

async function walkHtml(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtml(full, acc);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      acc.push(full);
    }
  }
  return acc;
}

export async function ensureSpaDirIndexHtml(outDir) {
  const htmlFiles = await walkHtml(outDir);
  let copied = 0;
  for (const htmlPath of htmlFiles) {
    const base = path.basename(htmlPath, ".html");
    if (base === "index" || base === "404" || base === "_not-found") continue;
    const dir = path.join(path.dirname(htmlPath), base);
    let isDir = false;
    try {
      isDir = (await stat(dir)).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) continue;
    const indexPath = path.join(dir, "index.html");
    try {
      await stat(indexPath);
      // already present
    } catch {
      await copyFile(htmlPath, indexPath);
      copied += 1;
    }
  }
  return copied;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const outDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), "out");
  const n = await ensureSpaDirIndexHtml(outDir);
  console.log(`spa-dir-index-html: ensured ${n} index.html file(s) under ${outDir}`);
}
