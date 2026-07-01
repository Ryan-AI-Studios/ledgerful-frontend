import { copyFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const source = resolve(__dirname, "..", "..", "ledgerful", "docs", "api", "openapi.json");
const destination = resolve(__dirname, "..", "src", "lib", "api", "contract", "openapi.json");

async function main() {
  try {
    await access(source);
  } catch {
    console.error(`ERROR: sibling schema not found at ${source}`);
    console.error("Expected the ledgerful backend repo next to this repo (../ledgerful).");
    process.exit(1);
  }

  await copyFile(source, destination);
  console.log(`Refreshed ${destination} from ${source}`);
}

main();
