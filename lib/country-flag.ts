import { countryName, isCountryCode } from "@/lib/countries";

// The public path of a country's vendored flag SVG, or null when the code is
// not one the app can render. Assets live in public/flags (see
// scripts/vendor-flags.mjs).
export function countryFlagUrl(code: string | null | undefined): string | null {
  if (!isCountryCode(code)) return null;
  return `/flags/${code!.toLowerCase()}.svg`;
}

export function countryLabel(code: string | null | undefined): string | null {
  return countryName(code);
}
