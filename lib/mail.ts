import nodemailer from "nodemailer";
import { normalizeEmail } from "@/lib/staff";

export type SendMailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "failed" };

const SMTP_TIMEOUT_MS = 15_000;

let transporter: nodemailer.Transporter | null = null;
let transporterKey = "";

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_APP_PASSWORD?.trim(),
  );
}

export function parseOptionalEmail(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  return normalizeEmail(trimmed);
}

function getTransporter(user: string, pass: string) {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const key = `${host}:${port}:${user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
  transporterKey = key;
  return transporter;
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendMailResult> {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const mailer = getTransporter(user, pass);
    await Promise.race([
      mailer.sendMail({
        from: `"YKS Takip" <${user}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        replyTo: input.replyTo,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("SMTP zaman aşımı")),
          SMTP_TIMEOUT_MS + 2_000,
        );
      }),
    ]);

    return { sent: true };
  } catch (error) {
    console.error("Mail gönderilemedi:", error);
    return { sent: false, reason: "failed" };
  }
}
