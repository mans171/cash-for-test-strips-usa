import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!isValidSession(session)) {
    redirect("/admin/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <AdminDashboardClient />
    </div>
  );
}
