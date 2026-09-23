// Vendors the country flags used by the app from the MIT-licensed `flag-icons`
// package into `public/flags`, so the app serves them itself: consistent on
// desktop and mobile, offline, and with no runtime third-party dependency.
//
// Run with `npm run vendor:flags`. Re-run after adding a country to
// `lib/countries.ts` or upgrading `flag-icons`. Commit the output.
//
// Source: https://github.com/lipis/flag-icons (MIT)

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const countriesSource = readFileSync(join(root, "lib", "countries.ts"), "utf8");
const outputDir = join(root, "public", "flags");
const sourceDir = join(root, "node_modules", "flag-icons", "flags", "4x3");
const licence = join(root, "node_modules", "flag-icons", "LICENSE");

const codes = [...countriesSource.matchAll(/code:\s*"([A-Z]{2})"/g)].map((match) =>
  match[1].toLowerCase(),
);

if (codes.length === 0) {
  throw new Error("No country codes found in lib/countries.ts");
}

mkdirSync(outputDir, { recursive: true });

let copied = 0;
const missing = [];
for (const code of codes) {
  const from = join(sourceDir, `${code}.svg`);
  if (!existsSync(from)) {
    missing.push(code);
    continue;
  }
  copyFileSync(from, join(outputDir, `${code}.svg`));
  copied += 1;
}

if (existsSync(licence)) {
  copyFileSync(licence, join(outputDir, "LICENSE"));
}

writeFileSync(
  join(outputDir, "ATTRIBUTION.txt"),
  [
    "Country flag SVGs are vendored from flag-icons (https://github.com/lipis/flag-icons),",
    "licensed under the MIT License. See LICENSE in this directory.",
    "Regenerate with `npm run vendor:flags`.",
    "",
  ].join("\n"),
);

if (missing.length > 0) {
  console.warn(`No flag asset for: ${missing.join(", ")}`);
}
console.log(`Vendored ${copied} flags to public/flags`);
