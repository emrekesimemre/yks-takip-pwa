import { getServerSession } from "next-auth";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import { authOptions } from "@/lib/auth";
import { isBootstrapAdminEmail } from "@/lib/staff";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const canManageStaff = isBootstrapAdminEmail(session?.user?.email);

  return <AdminDashboardClient canManageStaff={canManageStaff} />;
}
