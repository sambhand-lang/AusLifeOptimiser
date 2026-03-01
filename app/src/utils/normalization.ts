// utils/normalization.ts
// Utilities for normalizing values to a 0–100 scale

/**
 * Normalize a value where higher is better.
 * Returns a score between 0 and 100.
 */
export function normalizeDirect(value: number, min: number, max: number): number {
  if (min === max) return 50;
  if (max < min) [min, max] = [max, min]; // Defensive: swap if needed
  const score = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Normalize a value where lower is better.
 * Returns a score between 0 and 100.
 */
export function normalizeInverse(value: number, min: number, max: number): number {
  if (min === max) return 50;
  if (max < min) [min, max] = [max, min]; // Defensive: swap if needed
  const score = ((max - value) / (max - min)) * 100;
  return Math.max(0, Math.min(100, score));
}
