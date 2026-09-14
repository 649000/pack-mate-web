import type { Gender } from "./types";

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

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_DISPLAY_NAME_LENGTH = 80;

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
