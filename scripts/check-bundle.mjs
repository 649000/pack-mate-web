/* eslint-disable security/detect-non-literal-fs-filename -- intentionally walks the build output */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "out";
const FORBIDDEN = [
  "service_role",
  "SERVICE_ROLE",
  "SUPABASE_DB_URL",
  "BEGIN PRIVATE KEY",
  "private_key",
  "firebase-adminsdk",
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

try {
  await stat(OUT_DIR);
} catch {
  console.error(`No ${OUT_DIR}/ directory found. Run "npm run build" first.`);
  process.exit(1);
}

let checked = 0;
const hits = [];

for await (const file of walk(OUT_DIR)) {
  if (!/\.(js|mjs|html|json|css|txt)$/.test(file)) continue;
  const content = await readFile(file, "utf8");
  checked += 1;
  for (const needle of FORBIDDEN) {
    if (content.includes(needle)) {
      hits.push(`${file}: contains "${needle}"`);
    }
  }
}

if (hits.length > 0) {
  console.error("Bundle secret check FAILED:");
  for (const hit of hits) console.error(`  - ${hit}`);
  process.exit(1);
}

console.log(`Bundle secret check passed (${checked} files scanned, no forbidden patterns).`);
