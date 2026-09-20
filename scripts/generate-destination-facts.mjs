// Generates the destination_facts seed migration.
//
// Sources (all fetched at generation time, nothing ships at runtime):
//   - ISO 3166-1 alpha-2 codes and ISO 4217 currencies: mledoze/countries
//   - ITU-T E.164 country calling codes: libphonenumber-js (Google libphonenumber)
//   - IANA time zones: tzdb zone.tab (Eggert)
//   - Plug types, voltage and frequency: benjiao/world-plugs, scraped from IEC World Plugs
//
// The IEC scrape and mledoze omit a number of small territories and
// dependencies. OVERRIDES fills those from worldstandards.eu (electricity) and
// standard references (currency, calling code, time zones), inheriting from the
// administering country where the territory has no distinct supply. Antarctica
// is left without a currency or mains supply because it has neither.
//
// Usage: node scripts/generate-destination-facts.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCountryCallingCode } from "libphonenumber-js";

const COUNTRIES_URL = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
const ZONE_TAB_URL = "https://raw.githubusercontent.com/eggert/tz/main/zone.tab";
const PLUGS_URL = "https://raw.githubusercontent.com/benjiao/world-plugs/master/world-plugs.csv";

const OUTPUT = resolve(
  process.cwd(),
  "supabase/migrations/20260920020000_destination_facts_seed.sql",
);

async function getText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

// Minimal CSV parser: handles quoted fields, embedded commas and doubled quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function knownCountryCodes() {
  const source = readFileSync(resolve(process.cwd(), "lib/countries.ts"), "utf8");
  return [...source.matchAll(/code:\s*"([A-Z]{2})"/g)].map((match) => match[1]);
}

function offsetMinutes(tz, date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const value = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

const JANUARY = new Date("2025-01-15T12:00:00Z");
const JULY = new Date("2025-07-15T12:00:00Z");

// Curated values for territories the automated sources omit. Electricity values
// are from worldstandards.eu (plug/socket & voltage by country, 2025-09-07);
// currency, calling code and time zones inherit the administering country.
const OVERRIDES = {
  AQ: { calling: "+672" },
  AX: { plugs: ["C", "F"], voltage: "230", frequency: "50" },
  BL: { plugs: ["C", "E"], voltage: "230", frequency: "60" },
  BQ: { plugs: ["A", "B", "C", "F"], voltage: "110/127/220", frequency: "50/60" },
  BV: {
    currency: "NOK",
    calling: "+47",
    plugs: ["C", "F"],
    voltage: "230",
    frequency: "50",
    zones: ["Europe/Oslo"],
  },
  CC: { plugs: ["I"], voltage: "230", frequency: "50" },
  CX: { plugs: ["I"], voltage: "230", frequency: "50" },
  EH: { plugs: ["C", "E"], voltage: "230", frequency: "50" },
  FM: { currency: "USD" },
  GG: { plugs: ["G"], voltage: "230", frequency: "50" },
  GS: { calling: "+500", plugs: ["G"], voltage: "230", frequency: "50" },
  HM: { currency: "AUD", calling: "+672", plugs: ["I"], voltage: "230", frequency: "50" },
  IO: { plugs: ["G"], voltage: "230", frequency: "50" },
  JE: { plugs: ["G"], voltage: "230", frequency: "50" },
  MH: { plugs: ["A", "B"], voltage: "120", frequency: "60" },
  MP: { plugs: ["A", "B"], voltage: "120", frequency: "60" },
  NF: { plugs: ["I"], voltage: "230", frequency: "50" },
  NU: { plugs: ["I"], voltage: "230", frequency: "50" },
  PF: { plugs: ["C", "E"], voltage: "230", frequency: "60" },
  PM: { plugs: ["C", "E"], voltage: "230", frequency: "50" },
  PN: { calling: "+64", plugs: ["I"], voltage: "230", frequency: "50" },
  PS: { plugs: ["C", "H"], voltage: "230", frequency: "50" },
  SH: { plugs: ["G"], voltage: "230", frequency: "50" },
  SJ: { plugs: ["C", "F"], voltage: "230", frequency: "50" },
  SS: { plugs: ["C", "D", "G"], voltage: "230", frequency: "50" },
  SX: { plugs: ["A", "B"], voltage: "110", frequency: "60" },
  TF: { calling: "+262", plugs: ["C", "E"], voltage: "230", frequency: "50" },
  TK: { plugs: ["I"], voltage: "230", frequency: "50" },
  UM: { calling: "+1", plugs: ["A", "B"], voltage: "120", frequency: "60" },
  VA: { plugs: ["C", "F", "L"], voltage: "230", frequency: "50" },
  WF: { plugs: ["C", "E"], voltage: "230", frequency: "50" },
  YT: { plugs: ["C", "E"], voltage: "230", frequency: "50" },
};

// Collapse zones that share the same standard offset and daylight-saving
// behaviour, preferring the zone the tz database marks as "most areas". This
// turns the US's 28 sub-regional zones into its handful of real zones.
function reduceZones(zones) {
  const groups = new Map();
  for (const zone of zones) {
    const key = `${offsetMinutes(zone.tz, JANUARY)}|${offsetMinutes(zone.tz, JULY)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(zone);
  }
  const picked = [];
  for (const list of groups.values()) {
    const preferred =
      list.find((zone) => /most areas/.test(zone.comment)) ??
      list.find((zone) => !zone.comment.includes(" - ")) ??
      list[0];
    picked.push(preferred);
  }
  return picked
    .sort((a, b) => offsetMinutes(a.tz, JANUARY) - offsetMinutes(b.tz, JANUARY))
    .map((zone) => zone.tz);
}

function parseZones(zoneTab) {
  const byCountry = new Map();
  for (const line of zoneTab.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") continue;
    const [country, , tz, comment = ""] = line.split("\t");
    if (!country || !tz) continue;
    if (!byCountry.has(country)) byCountry.set(country, []);
    byCountry.get(country).push({ tz, comment });
  }
  return byCountry;
}

function parseElectricity(csv) {
  const rows = parseCsv(csv);
  const header = rows[0].map((value) => value.trim());
  const index = Object.fromEntries(header.map((name, i) => [name, i]));
  const byCountry = new Map();
  for (const row of rows.slice(1)) {
    const code = (row[index.country_code] ?? "").trim();
    if (!/^[A-Z]{2}$/.test(code)) continue;
    const plugType = /Type ([A-O])/.exec(row[index.plug_type] ?? "");
    const voltages = (row[index.voltage] ?? "").match(/\d+/g) ?? [];
    const frequencies = (row[index.frequency] ?? "").match(/\d+/g) ?? [];
    if (!byCountry.has(code)) {
      byCountry.set(code, { plugs: new Set(), voltages: new Set(), frequencies: new Set() });
    }
    const entry = byCountry.get(code);
    if (plugType) entry.plugs.add(plugType[1]);
    for (const voltage of voltages) entry.voltages.add(voltage);
    for (const frequency of frequencies) entry.frequencies.add(frequency);
  }
  const result = new Map();
  for (const [code, entry] of byCountry) {
    result.set(code, {
      plugs: [...entry.plugs].sort(),
      voltage: [...entry.voltages].sort((a, b) => Number(a) - Number(b)).join("/") || null,
      frequency: [...entry.frequencies].sort((a, b) => Number(a) - Number(b)).join("/") || null,
    });
  }
  return result;
}

function sqlText(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(values) {
  if (!values || values.length === 0) return "'{}'";
  return `array[${values.map((value) => sqlText(value)).join(", ")}]`;
}

async function main() {
  const [countriesJson, zoneTab, plugsCsv] = await Promise.all([
    getText(COUNTRIES_URL).then(JSON.parse),
    getText(ZONE_TAB_URL),
    getText(PLUGS_URL),
  ]);

  const codes = knownCountryCodes();
  const countries = new Map(countriesJson.map((country) => [country.cca2, country]));
  const zones = parseZones(zoneTab);
  const electricity = parseElectricity(plugsCsv);

  const rows = [];
  const missing = { currency: [], calling: [], zones: [], electricity: [] };

  for (const code of codes) {
    const country = countries.get(code);
    const override = OVERRIDES[code] ?? {};
    const currency =
      override.currency ?? (country ? (Object.keys(country.currencies ?? {})[0] ?? null) : null);
    let calling = override.calling ?? null;
    if (!calling) {
      try {
        calling = `+${getCountryCallingCode(code)}`;
      } catch {
        calling = null;
      }
    }
    const countryZones = override.zones ?? reduceZones(zones.get(code) ?? []);
    const power = electricity.get(code);
    const plugs = override.plugs ?? power?.plugs ?? [];
    const voltage = override.voltage ?? power?.voltage ?? null;
    const frequency = override.frequency ?? power?.frequency ?? null;

    if (!currency) missing.currency.push(code);
    if (!calling) missing.calling.push(code);
    if (countryZones.length === 0) missing.zones.push(code);
    if (plugs.length === 0) missing.electricity.push(code);

    rows.push({ code, currency, calling, plugs, voltage, frequency, zones: countryZones });
  }

  const values = rows
    .map(
      (row) =>
        `  (${sqlText(row.code)}, ${sqlText(row.currency)}, ${sqlText(row.calling)}, ` +
        `${sqlArray(row.plugs)}, ${sqlText(row.voltage)}, ${sqlText(row.frequency)}, ` +
        `${sqlArray(row.zones)})`,
    )
    .join(",\n");

  const sql = `-- Destination facts seed (generated)
-- Schema: packmate
-- Generated by scripts/generate-destination-facts.mjs. Do not edit by hand.
-- Sources: mledoze/countries (ISO 3166/4217), libphonenumber (ITU-T E.164),
-- IANA tzdb zone.tab, benjiao/world-plugs (scraped from IEC World Plugs), and
-- worldstandards.eu for territories the automated sources omit.

insert into packmate.destination_facts
  (country_code, currency_code, calling_code, plug_types, voltage, frequency, timezones)
values
${values}
on conflict (country_code) do nothing;
`;

  writeFileSync(OUTPUT, sql, "utf8");
  console.log(`Wrote ${rows.length} rows to ${OUTPUT}`);
  for (const [field, list] of Object.entries(missing)) {
    console.log(`missing ${field}: ${list.length}${list.length ? ` -> ${list.join(", ")}` : ""}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
