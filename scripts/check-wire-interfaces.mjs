import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const apiDir = resolve(process.cwd(), "src", "lib", "api");
const allowedDeclarations = new Map([
  // /api/trends is PLANNED (not shipped) — trends.ts uses TrendPoint from
  // src/lib/types.ts (outside src/lib/api/), so it isn't caught by this scan.
  // When /api/trends is built, remove the hand-declared type and adopt
  // ExtractResponse<"/api/trends","get">.
]);

const declarationPattern = /(?:^|\n)(?:export\s+)?(?:interface|type)\s+([A-Za-z][A-Za-z0-9_]*(?:Api|ApiResponse|ApiItem|Response)(?:[A-Za-z0-9_]*))/g;

async function main() {
  const entries = await readdir(apiDir, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    if (entry.name === "generated.d.ts" || entry.name === "contract-types.ts") continue;

    const filePath = `src/lib/api/${entry.name}`;
    const content = await readFile(resolve(apiDir, entry.name), "utf-8");
    let match;
    while ((match = declarationPattern.exec(content)) !== null) {
      const name = match[1];
      const allowedPath = allowedDeclarations.get(name);
      if (allowedPath && allowedPath === filePath) continue;
      violations.push({ name, filePath });
    }
  }

  if (violations.length > 0) {
    console.error("ERROR: non-allowlisted wire interface declarations found:");
    for (const v of violations) {
      console.error(`  - ${v.name} in ${v.filePath}`);
    }
    console.error("Wire interfaces must come from src/lib/api/generated.d.ts via ExtractResponse.");
    process.exit(1);
  }

  console.log("OK: no non-allowlisted wire interface declarations in src/lib/api/*.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
