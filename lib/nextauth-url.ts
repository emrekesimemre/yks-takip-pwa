const PRODUCTION_URL = "https://yks-takip-pied.vercel.app";
const DEVELOPMENT_URL = "http://localhost:3000";

export function getNextAuthUrl(): string {
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_URL
    : DEVELOPMENT_URL;
}

export function ensureNextAuthUrl(): void {
  process.env.NEXTAUTH_URL = getNextAuthUrl();
}
