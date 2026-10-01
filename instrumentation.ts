import { assertServerEnv } from "@/lib/env";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    assertServerEnv();
    if (process.env.SENTRY_DSN) {
      await import("./sentry.server.config");
    }
  }

  if (process.env.NEXT_RUNTIME === "edge" && process.env.SENTRY_DSN) {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  error: unknown,
  request: { method?: string; path?: string },
  context: { routerKind?: string },
) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, {
    extra: {
      method: request.method,
      path: request.path,
      routerKind: context.routerKind,
    },
  });
}
