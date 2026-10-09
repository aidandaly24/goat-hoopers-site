import { betterAuth, type BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import type { FriendsAuthConfig } from "./config";

export type AccountMail = { to: string; url: string; kind: "verify" | "reset" };
export type SendAccountMail = (mail: AccountMail) => Promise<void>;

export const providerModels = {
  user: { modelName: "authUser" }, account: { modelName: "authAccount", accountLinking: { enabled: false } },
  verification: { modelName: "authVerification" },
  rateLimit: { enabled: true, storage: "database" as const, modelName: "authRateLimit", window: 60, max: 20,
    customRules: { "/sign-in/email": { window: 900, max: 10 }, "/request-password-reset": { window: 900, max: 3 },
      "/send-verification-email": { window: 900, max: 3 } } },
};

/** Only bounded transactional registration/enrollment factories enable signup; the mounted factory never does. */
export function createFriendsAuth(options: {
  database: BetterAuthOptions["database"];
  config: FriendsAuthConfig;
  sendMail: SendAccountMail;
  allowSignup?: boolean;
  background?: (task: Promise<unknown>) => void;
  serverActions?: boolean;
}) {
  return betterAuth({
    ...providerModels, database: options.database,
    secret: options.config.secret, baseURL: options.config.origin, trustedOrigins: [options.config.origin],
    logger: { disabled: true }, telemetry: { enabled: false },
    emailAndPassword: {
      enabled: true, disableSignUp: !options.allowSignup, requireEmailVerification: true, autoSignIn: false,
      minPasswordLength: 8, maxPasswordLength: 128, resetPasswordTokenExpiresIn: 30 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        if (user.emailVerified) await options.sendMail({ to: user.email, url, kind: "reset" });
      },
    },
    emailVerification: {
      sendOnSignUp: true, sendOnSignIn: true, expiresIn: 60 * 60, autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => options.sendMail({ to: user.email, url, kind: "verify" }),
    },
    session: {
      modelName: "authSession", expiresIn: 90 * 24 * 60 * 60, updateAge: 24 * 60 * 60,
      freshAge: 5 * 60, cookieCache: { enabled: false },
    },
    advanced: {
      cookiePrefix: "goat-auth", useSecureCookies: options.config.secureCookies,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: options.config.secureCookies },
      backgroundTasks: options.background ? { handler: options.background } : undefined,
    },
    plugins: options.serverActions ? [nextCookies()] : [],
  });
}
