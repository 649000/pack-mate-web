export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

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
