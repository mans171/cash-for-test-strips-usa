import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth";
import { AdminDashboardClient } from "./AdminDashboardClient";
import { LogoutButton } from "./LogoutButton";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSession(session))) {
    redirect("/admin/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <LogoutButton />
      </div>
      <AdminDashboardClient />
    </div>
  );
}
