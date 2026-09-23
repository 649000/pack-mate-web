import type { ReusableItem } from "../types";
import { tripLength } from "../trip-status";
import type { Suggestion, SuggestionContext, SuggestionProvider } from "./types";

const ADAPTER_PATTERN = /\b(adapter|adaptor|converter|plug)\b/i;
const ESSENTIALS = ["passport", "wallet", "phone", "keys", "boarding pass"];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function entryNames(context: SuggestionContext): string[] {
  return context.entries.map((entry) => normalize(entry.name));
}

function libraryMatch(
  context: SuggestionContext,
  name: string,
): Pick<ReusableItem, "id" | "name" | "category"> | undefined {
  const target = normalize(name);
  return context.libraryItems.find((item) => normalize(item.name) === target);
}

// Inclusive day count when both dates are present, otherwise null.
export function tripLengthDays(context: SuggestionContext): number | null {
  return tripLength(context.trip.startDate, context.trip.endDate)?.days ?? null;
}

function addAction(context: SuggestionContext, name: string, category: Suggestion["category"]) {
  const match = libraryMatch(context, name);
  return match
    ? ({ kind: "library-item", itemId: match.id } as const)
    : ({ kind: "create-item", name, category } as const);
}

export function ruleSuggestions(context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const names = entryNames(context);
  const hasNameMatching = (pattern: RegExp) => names.some((name) => pattern.test(name));

  const plugTypes = context.facts?.plug_types ?? [];
  if (plugTypes.length > 0 && !hasNameMatching(ADAPTER_PATTERN)) {
    const label = plugTypes.map((type) => `Type ${type}`).join(", ");
    suggestions.push({
      key: `rules:adapter:${plugTypes.join("")}`,
      name: "Travel adapter",
      reason: `${context.trip.destination ?? "This destination"} uses ${label} plugs, and none is on the list yet.`,
      category: "gear",
      action: addAction(context, "Travel adapter", "gear"),
      source: "rules",
      confidence: 1,
    });
  }

  const days = tripLengthDays(context);
  const hasClothing = context.entries.some((entry) => entry.category === "clothing");
  if (days !== null && days >= 3 && !hasClothing) {
    suggestions.push({
      key: "rules:clothing",
      name: "Clothing",
      reason: `A ${days}-day trip with no clothing on the list yet.`,
      category: "clothing",
      action: addAction(context, "Clothing", "clothing"),
      source: "rules",
      confidence: 0.8,
    });
  }

  const hasWithMe = context.entries.some((entry) => entry.isWithMe);
  const hasEssential = ESSENTIALS.some((essential) =>
    names.some((name) => name.includes(essential)),
  );
  if (!hasWithMe && !hasEssential) {
    suggestions.push({
      key: "rules:essentials:passport",
      name: "Passport",
      reason: "Nothing is carried With Me yet — add the essentials you keep on you.",
      category: "documents",
      action: addAction(context, "Passport", "documents"),
      source: "rules",
      confidence: 0.6,
    });
  }

  return suggestions;
}

// The always-on baseline provider. A future AI provider is added alongside it.
export const rulesProvider: SuggestionProvider = {
  id: "rules",
  async getSuggestions(context) {
    return ruleSuggestions(context);
  },
};
