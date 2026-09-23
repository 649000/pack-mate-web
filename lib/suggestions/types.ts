import type { DestinationFacts, ItemCategory } from "../types";

// Where a suggestion came from. Rules are the always-on baseline; "ai" is
// reserved for a future provider.
export type SuggestionSource = "rules" | "ai";

export type SuggestionAddAction =
  | { kind: "library-item"; itemId: string }
  | { kind: "create-item"; name: string; category: ItemCategory | null };

export type Suggestion = {
  // Stable, content-based identity used for de-duplication and persisted
  // dismissals. Must not change between renders for the same suggestion.
  key: string;
  name: string;
  // Short, human-readable explanation ("why am I seeing this?").
  reason: string;
  category: ItemCategory | null;
  action: SuggestionAddAction;
  source: SuggestionSource;
  // 0..1. Rules are certain; a future model would return its own confidence.
  confidence: number;
};

// Everything a provider may use, assembled by the caller from data the app
// already holds so providers stay pure and independent of Supabase.
export type SuggestionContext = {
  trip: {
    id: string;
    destination: string | null;
    countryCode: string;
    startDate: string | null;
    endDate: string | null;
  };
  facts: DestinationFacts | null;
  entries: { name: string; category: ItemCategory | null; isWithMe: boolean }[];
  libraryItems: { id: string; name: string; category: ItemCategory | null }[];
};

export interface SuggestionProvider {
  id: string;
  getSuggestions(context: SuggestionContext): Promise<Suggestion[]>;
}
