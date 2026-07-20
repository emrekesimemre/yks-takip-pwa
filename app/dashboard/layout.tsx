import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isAdminEmail, isTeacherEmail } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const email = session.user?.email;
  const isTeacher = isTeacherEmail(email);
  const isAdmin = isAdminEmail(email);

  if (!isTeacher) {
    redirect(isAdmin ? "/admin" : "/");
  }

  return (
    <div className="min-h-screen app-bg overflow-x-hidden flex flex-col">
      <AppHeader
        userName={session.user?.name}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
      />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-8 print:p-0 print:max-w-none w-full min-w-0 flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
