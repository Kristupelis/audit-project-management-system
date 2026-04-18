import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";
import AdminUsersPage from "./users-page";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.apiAccessToken) {
    redirect("/login");
  }

  if (session.user?.systemRole !== "SUPER_ADMIN") {
    redirect("/projects");
  }

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  return (
    <AdminUsersPage/>
  );
}