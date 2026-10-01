const PRODUCTION_FALLBACK = "https://yks-takip-pied.vercel.app";
const DEVELOPMENT_URL = "http://localhost:3000";

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function fromEnvUrl(): string | null {
  const explicit =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return null;
}

export function getPublicSiteUrl(): string {
  return fromEnvUrl() ?? (
    process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK : DEVELOPMENT_URL
  );
}

export function getNextAuthUrl(): string {
  return getPublicSiteUrl();
}

export function ensureNextAuthUrl(): void {
  if (!process.env.NEXTAUTH_URL?.trim()) {
    process.env.NEXTAUTH_URL = getNextAuthUrl();
  }
}
