import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Derives up-to-two-letter initials from an email address or display name.
 */
export function initials(value: string): string {
  const name = value.includes("@") ? (value.split("@")[0] ?? "") : value;
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
