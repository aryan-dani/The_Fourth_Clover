"use client";

/** Log only in development (avoid noisy / leaky production consoles). */
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== "development") return;
  console.log(...args);
}
