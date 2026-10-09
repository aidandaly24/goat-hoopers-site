export type EnrollmentInput = {
  kind: "invite" | "existing";
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
};

export type RegistrationInput = { email: string; password: string; username: string };

export function parseAccountUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const username = value.trim().toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(username) ? username : null;
}

/** Registration creates an email account only; clients cannot assign a team or app identity. */
export function parseRegistration(value: unknown): RegistrationInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !["email", "password", "username"].includes(key))) return null;
  const parsed = parseEnrollment({ email: row.email, password: row.password, displayName: row.username, kind: "existing" });
  if (!parsed) return null;
  return { email: parsed.email, password: parsed.password, username: parsed.displayName };
}

export function parseTeamClaim(value: unknown): { inviteCode: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== 1 || typeof row.inviteCode !== "string" || !/^\d{6}$/.test(row.inviteCode)) return null;
  return { inviteCode: row.inviteCode };
}

export function parseTeamRecovery(value: unknown): { teamId: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== 1 || typeof row.teamId !== "string" || !/^\d{1,10}$/.test(row.teamId)) return null;
  return { teamId: row.teamId };
}

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
  const displayName = row.kind === "existing" ? parseAccountUsername(row.displayName) : typeof row.displayName === "string" ? row.displayName.trim() : "";
  if (displayName === null) return null;
  const inviteCode = typeof row.inviteCode === "string" ? row.inviteCode.trim() : "";
  if (row.kind === "invite" && (!/^\d{6}$/.test(inviteCode) || !displayName || displayName.length > 40)) return null;
  return { kind: row.kind, email, password: row.password, displayName, inviteCode };
}
