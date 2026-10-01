import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { assertServerEnv } from "@/lib/env";
import { ensureNextAuthUrl } from "@/lib/nextauth-url";
import { resolveStaffAccess } from "@/lib/staff";

assertServerEnv();
ensureNextAuthUrl();

export async function isTeacherEmail(email: string | null | undefined): Promise<boolean> {
  return (await resolveStaffAccess(email)).isTeacher;
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  return (await resolveStaffAccess(email)).isAdmin;
}

export async function canSignIn(email: string | null | undefined): Promise<boolean> {
  const access = await resolveStaffAccess(email);
  return access.isAdmin || access.isTeacher;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      const userEmail = user.email?.toLowerCase();

      if (userEmail && (await canSignIn(userEmail))) {
        return true;
      }

      console.log("🚨 REDDEDİLEN GİRİŞ DENEMESİ 🚨");
      console.log("Gelen Mail:", userEmail);

      return false;
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (email) {
        token.email = email;
        const access = await resolveStaffAccess(email);
        token.isAdmin = access.isAdmin;
        token.isTeacher = access.isTeacher;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.isTeacher = Boolean(token.isTeacher);
      }
      return session;
    },
  },
};
