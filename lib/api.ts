import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return jsonError("Oturum gerekli.", 401);
}

export function forbidden() {
  return jsonError("Bu işlem için yetkiniz yok.", 403);
}

export async function readJsonBody(
  req: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, data: await req.json() };
  } catch {
    return { ok: false, response: jsonError("Geçersiz istek gövdesi.", 400) };
  }
}

export function parseObjectIdParam(id: string) {
  if (!isValidObjectId(id)) {
    return jsonError("Geçersiz öğrenci kimliği.", 400);
  }
  return null;
}

export function isMongoCastError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "CastError"
  );
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) return first.trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
}
