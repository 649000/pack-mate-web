import { rulesProvider } from "./rules";
import type { Suggestion, SuggestionContext, SuggestionProvider } from "./types";

export type { Suggestion, SuggestionContext, SuggestionProvider } from "./types";

// Merge suggestions from every provider, dropping duplicate keys and duplicate
// names, then rank most-confident first.
export function combineSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const byKey = new Map<string, Suggestion>();
  const seenNames = new Set<string>();
  for (const suggestion of suggestions) {
    const name = suggestion.name.trim().toLowerCase();
    if (byKey.has(suggestion.key) || seenNames.has(name)) continue;
    byKey.set(suggestion.key, suggestion);
    seenNames.add(name);
  }
  return [...byKey.values()].sort((a, b) => b.confidence - a.confidence);
}

// The single async seam the UI depends on. Rules are always the baseline;
// extra providers are additive and their failures are swallowed, so a disabled
// or failing provider never removes the rules or surfaces an error.
export async function getTripSuggestions(
  context: SuggestionContext,
  extraProviders: SuggestionProvider[] = [],
): Promise<Suggestion[]> {
  const providers = [rulesProvider, ...extraProviders];
  const results = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await provider.getSuggestions(context);
      } catch {
        return [] as Suggestion[];
      }
    }),
  );
  return combineSuggestions(results.flat());
}
