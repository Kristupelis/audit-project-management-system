import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import AdminUsersPage from "./users-page";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.apiAccessToken) {
    redirect("/login");
  }

  if (session.user?.systemRole !== "SUPER_ADMIN") {
    redirect("/projects");
  }

  return (
    <AdminUsersPage/>
  );
}