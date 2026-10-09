import type { AccountMail, SendAccountMail } from "./provider";

/** Every emission shares a durable per-kind cap, including automatic sign-in verification. */
export async function sendAccountMail(mail: AccountMail,
  consume: (key: string, max: number) => Promise<boolean>, deliver: SendAccountMail = deliverAccountMail): Promise<void> {
  if (!await consume(`mail:${mail.kind}`, 10)) return;
  await deliver(mail);
}

/** No provisioning or secret export. Aidan supplies an authorized sending key and verified sender. */
async function deliverAccountMail(mail: AccountMail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!key || !from) throw new Error("Account email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [mail.to],
      subject: mail.kind === "verify" ? "Verify your GOAT Hoopers email" : "Reset your GOAT Hoopers password",
      text: `${mail.kind === "verify" ? "Verify your email" : "Reset your password"}: ${mail.url}\n\nIf you did not request this, ignore this email.`,
    }), signal: AbortSignal.timeout(8000),
  });
  // Never log provider bodies, recipients, credentials, reset URLs or tokens.
  if (!response.ok) throw new Error("Account email could not be delivered");
}
