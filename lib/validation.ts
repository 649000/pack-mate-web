import type { DisplayWeightUnit, Gender, ItemCategory } from "./types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const GENDERS = [
  "female",
  "male",
  "other",
  "prefer_not_to_say",
] as const satisfies readonly Gender[];

// The canonical fixed set of item categories. The database check constraints
// mirror this list; keep the two in sync.
export const ITEM_CATEGORIES = [
  "documents",
  "valuables",
  "health",
  "clothing",
  "footwear",
  "swim_beach",
  "formal",
  "toiletries",
  "comfort",
  "electronics",
  "work_study",
  "entertainment",
  "sports",
  "gear",
  "food",
  "laundry",
  "baby_kids",
  "pets",
  "religious",
  "accessibility",
] as const satisfies readonly ItemCategory[];

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  documents: "Documents & Money",
  valuables: "Valuables & Jewellery",
  health: "Health & Medication",
  clothing: "Clothing",
  footwear: "Footwear",
  swim_beach: "Swim & Beach",
  formal: "Formal & Occasion",
  toiletries: "Toiletries & Personal Care",
  comfort: "Comfort & Sleep",
  electronics: "Electronics",
  work_study: "Work & Study",
  entertainment: "Entertainment",
  sports: "Sports & Outdoors",
  gear: "Gear & Accessories",
  food: "Food & Snacks",
  laundry: "Laundry & Care",
  baby_kids: "Baby & Kids",
  pets: "Pets",
  religious: "Religious & Cultural",
  accessibility: "Accessibility & Mobility",
};

// Grouping is a UI concern only; storage stays a flat set.
export const ITEM_CATEGORY_GROUPS = [
  { label: "Essentials", categories: ["documents", "valuables", "health"] },
  { label: "Clothing & Wear", categories: ["clothing", "footwear", "swim_beach", "formal"] },
  { label: "Personal Care", categories: ["toiletries", "comfort"] },
  { label: "Technology", categories: ["electronics", "work_study", "entertainment"] },
  { label: "Activity & Gear", categories: ["sports", "gear"] },
  {
    label: "Living & Other",
    categories: ["food", "laundry", "baby_kids", "pets", "religious", "accessibility"],
  },
] as const satisfies readonly { label: string; categories: readonly ItemCategory[] }[];

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_WEIGHT_GRAMS = 100000;

const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export function validateName(value: string, field = "Name"): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${field} is required`);
  }
  return trimmed;
}

export function validateQty(value: number, field = "Quantity"): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError(`${field} must be a whole number of at least 1`);
  }
  return value;
}

export function parseQty(value: string, field = "Quantity"): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${field} must be a number`);
  }
  return validateQty(parsed, field);
}

export function validateDateRange(
  startDate: string | null,
  endDate: string | null,
): { startDate: string | null; endDate: string | null } {
  if (startDate && endDate && endDate < startDate) {
    throw new ValidationError("End date cannot be before start date");
  }
  return { startDate, endDate };
}

// ---------------------------------------------------------------------------
// Account / profile
// ---------------------------------------------------------------------------

export function validateOptionalName(
  value: string | null | undefined,
  field = "Name",
): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new ValidationError(`${field} cannot exceed ${MAX_DISPLAY_NAME_LENGTH} characters`);
  }
  return trimmed;
}

export function validateOptionalUrl(
  value: string | null | undefined,
  field = "URL",
): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return null;
  if (!HTTP_URL_PATTERN.test(trimmed)) {
    throw new ValidationError(`${field} must be a valid http or https URL`);
  }
  return trimmed;
}

export function validateOptionalDescription(
  value: string | null | undefined,
  field = "Description",
): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`${field} cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
  }
  return trimmed;
}

export function validateWeight(value: number | null | undefined, field = "Weight"): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new ValidationError(`${field} must be a number of 0 or more`);
  }
  if (value > MAX_WEIGHT_GRAMS) {
    throw new ValidationError(`${field} cannot exceed ${MAX_WEIGHT_GRAMS} g`);
  }
  return value;
}

export function validateWeightLimit(
  value: number | null | undefined,
  field = "Weight limit",
): number | null {
  return validateWeight(value, field);
}

export function validateWeightUnit(value: string | null | undefined): DisplayWeightUnit {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return "kg";
  if (trimmed !== "kg" && trimmed !== "lb") {
    throw new ValidationError("Select a valid weight unit");
  }
  return trimmed;
}

export function validateBirthday(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new ValidationError("Birthday must be a valid date");
  }
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
    throw new ValidationError("Birthday must be a valid date");
  }
  if (trimmed > new Date().toISOString().slice(0, 10)) {
    throw new ValidationError("Birthday cannot be in the future");
  }
  return trimmed;
}

export function validateGender(value: string | null | undefined): Gender | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return null;
  if (!(GENDERS as readonly string[]).includes(trimmed)) {
    throw new ValidationError("Select a valid gender");
  }
  return trimmed as Gender;
}

export function validateCategory(value: string | null | undefined): ItemCategory | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length === 0) return null;
  if (!(ITEM_CATEGORIES as readonly string[]).includes(trimmed)) {
    throw new ValidationError("Select a valid category");
  }
  return trimmed as ItemCategory;
}

export function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new ValidationError("Enter a valid email address");
  }
  return trimmed;
}

export function validatePassword(value: string): string {
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return value;
}
