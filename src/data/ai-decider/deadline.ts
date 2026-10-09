/** Bound AI data operations. A timed-out reservation never permits a provider call. */
export async function aiDataDeadline<T>(operation: Promise<T>, ms = 1000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("state_unavailable")), ms); })]);
  } finally { clearTimeout(timer); }
}
