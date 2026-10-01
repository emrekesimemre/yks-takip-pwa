import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail, isTeacherEmail } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { NextResponse } from "next/server";

type AuthFailure = { ok: false; response: NextResponse };
type AuthSuccess = { ok: true; email: string };

export async function requireTeacherSession(): Promise<AuthFailure | AuthSuccess> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return { ok: false, response: unauthorized() };
  if (!(await isTeacherEmail(email))) {
    return { ok: false, response: forbidden() };
  }
  return { ok: true, email };
}

export async function requireAdminSession(): Promise<AuthFailure | AuthSuccess> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return { ok: false, response: unauthorized() };
  if (!(await isAdminEmail(email))) {
    return { ok: false, response: forbidden() };
  }
  return { ok: true, email };
}
