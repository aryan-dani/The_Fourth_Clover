/** Lightweight Supabase error logger for production UI paths. */

export function logSupabaseError(
  operation: string,
  error: unknown,
  context?: unknown
) {
  const err = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null;

  console.group(`Supabase Error - ${operation}`);
  console.error("Error:", error);
  console.error("Error Message:", err?.message);
  console.error("Error Code:", err?.code);
  console.error("Error Details:", err?.details);
  console.error("Error Hint:", err?.hint);
  if (context) {
    console.error("Context:", context);
  }
  console.groupEnd();

  return {
    message: err?.message || "Unknown error",
    code: err?.code,
    details: err?.details,
    hint: err?.hint,
    operation,
    context,
  };
}
