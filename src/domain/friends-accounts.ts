export type EnrollmentInput = {
  kind: "invite" | "existing";
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
};

/** Exact enrollment fields: ownership and provider IDs always come from the server. */
export function parseEnrollment(value: unknown): EnrollmentInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !["kind", "email", "password", "displayName", "inviteCode"].includes(key))) return null;
  if (row.kind !== "invite" && row.kind !== "existing") return null;
  if (typeof row.email !== "string" || typeof row.password !== "string") return null;
  const email = row.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      row.password.length < 8 || row.password.length > 128) return null;
  const displayName = typeof row.displayName === "string" ? row.displayName.trim() : "";
  const inviteCode = typeof row.inviteCode === "string" ? row.inviteCode.trim() : "";
  if (row.kind === "invite" && (!/^\d{6}$/.test(inviteCode) || !displayName || displayName.length > 40)) return null;
  return { kind: row.kind, email, password: row.password, displayName, inviteCode };
}
