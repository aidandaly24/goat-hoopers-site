import { bigint, boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { siteUsers } from "@/data/db";

// Core fields match Better Auth 1.7.7 getAuthTables; tested against its actual schema.
export const authUser = pgTable("auth_user", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  email: text("email").notNull().unique(), emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"), createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
export const authSession = pgTable("auth_session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(), createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(), ipAddress: text("ip_address"),
  userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" }),
}, (t) => [index("auth_session_user_idx").on(t.userId)]);
export const authAccount = pgTable("auth_account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => authUser.id, { onDelete: "cascade" }),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"), password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (t) => [index("auth_account_user_idx").on(t.userId)]);
export const authVerification = pgTable("auth_verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (t) => [index("auth_verification_identifier_idx").on(t.identifier)]);
export const authRateLimit = pgTable("auth_rate_limit", {
  id: text("id").primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const accountIdentities = pgTable("account_identities", {
  subject: text("subject").primaryKey().references(() => authUser.id, { onDelete: "restrict" }),
  userId: uuid("user_id").notNull().unique().references(() => siteUsers.id, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(true),
});
/** Fixed endpoint keys only; atomic global throttles supplement provider HTTP limits. */
export const authAttemptWindows = pgTable("auth_attempt_windows", {
  key: text("key").primaryKey(), count: integer("count").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const providerSchema = { authUser, authSession, authAccount, authVerification, authRateLimit };
