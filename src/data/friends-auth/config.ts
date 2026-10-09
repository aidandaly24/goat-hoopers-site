/** Default-off cutover: importing account pages never opens a provider connection. */
export function friendsAuthEnabled(): boolean {
  return process.env.FRIENDS_AUTH_ENABLED === "1";
}

export function friendsEnrollmentEnabled(): boolean {
  return friendsAuthEnabled() || process.env.FRIENDS_AUTH_ENROLLMENT === "1";
}

export type FriendsAuthConfig = {
  secret: string;
  origin: string;
  secureCookies: boolean;
};

export function readFriendsAuthConfig(): FriendsAuthConfig {
  const secret = process.env.BETTER_AUTH_SECRET;
  const url = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !url) throw new Error("Friends auth configuration is incomplete");
  const parsed = new URL(url);
  const secureCookies = parsed.protocol === "https:";
  if (parsed.origin !== url || parsed.username || parsed.password ||
      (!secureCookies && !(process.env.NODE_ENV !== "production" && parsed.hostname === "localhost"))) {
    throw new Error("Friends auth needs an exact HTTPS origin (localhost allowed in development)");
  }
  return { secret, origin: parsed.origin, secureCookies };
}
