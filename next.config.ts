import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/~offline",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const baseSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // next-pwa webpack eklentisi varken dev (Turbopack) modunun çalışması için gerekli
  turbopack: {},
  headers() {
    const headers = [...baseSecurityHeaders];
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.googleusercontent.com",
      "font-src 'self' data:",
      "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://*.ingest.sentry.io https://*.sentry.io",
      "frame-src https://accounts.google.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
      csp.push("upgrade-insecure-requests");
    }

    headers.push({
      key: "Content-Security-Policy",
      value: csp.join("; "),
    });

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default withPWA(nextConfig);
