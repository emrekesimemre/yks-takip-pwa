import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function parseEmailList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getTeacherEmails(): string[] {
  return parseEmailList(process.env.ALLOWED_EMAILS);
}

export function getAdminEmails(): string[] {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

export function isTeacherEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getTeacherEmails().includes(email.toLowerCase());
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function canSignIn(email: string | null | undefined): boolean {
  return isTeacherEmail(email) || isAdminEmail(email);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      const userEmail = user.email?.toLowerCase();

      if (userEmail && canSignIn(userEmail)) {
        return true;
      }

      console.log("🚨 REDDEDİLEN GİRİŞ DENEMESİ 🚨");
      console.log("Gelen Mail:", userEmail);
      console.log("İzin Verilen Öğretmen Mailleri:", getTeacherEmails());
      console.log("İzin Verilen Admin Mailleri:", getAdminEmails());

      return false;
    },
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (email) {
        token.email = email;
        token.isAdmin = isAdminEmail(email);
        token.isTeacher = isTeacherEmail(email);
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
