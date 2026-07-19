import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isAdminEmail, isTeacherEmail } from "@/lib/auth";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const email = session.user?.email;
  const isAdmin = isAdminEmail(email);
  const isTeacher = isTeacherEmail(email);

  if (!isAdmin) {
    redirect(isTeacher ? "/dashboard" : "/");
  }

  return (
    <div className="min-h-screen app-bg overflow-x-hidden">
      <AdminHeader
        userName={session.user?.name}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
      />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-8 w-full min-w-0">{children}</main>
    </div>
  );
}
