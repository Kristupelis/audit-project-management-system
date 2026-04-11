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
    <AdminUsersPage
      backLabel={t.projects.backToProjects}
      title={locale === "lt" ? "Administravimo skydas" : "Admin panel"}
      subtitle={
        locale === "lt"
          ? "Naudotojų paskyrų valdymas"
          : "Manage user accounts"
      }
      blockLabel={locale === "lt" ? "Blokuoti" : "Block"}
      unblockLabel={locale === "lt" ? "Atblokuoti" : "Unblock"}
      deleteLabel={locale === "lt" ? "Šalinti" : "Delete"}
      blockedLabel={locale === "lt" ? "UŽBLOKUOTAS" : "BLOCKED"}
      membershipsLabel={
        locale === "lt" ? "Projekto narystės" : "Project memberships"
      }
      reasonLabel={locale === "lt" ? "Priežastis" : "Reason"}
      loadingLabel={t.common.loading}
      cancelLabel={t.common.cancel}
      confirmLabel={locale === "lt" ? "Patvirtinti" : "Confirm"}
      errorLabel={t.common.error}
      closeLabel={t.common.close}
      blockUserTitle={locale === "lt" ? "Blokuoti naudotoją" : "Block user"}
      unblockUserTitle={
        locale === "lt" ? "Atblokuoti naudotoją" : "Unblock user"
      }
      deleteUserTitle={
        locale === "lt" ? "Šalinti naudotoją" : "Delete user"
      }
      blockReasonLabel={
        locale === "lt" ? "Blokavimo priežastis" : "Block reason"
      }
      confirmBlockText={
        locale === "lt"
          ? "Ar tikrai norite užblokuoti"
          : "Are you sure you want to block"
      }
      confirmUnblockText={
        locale === "lt"
          ? "Ar tikrai norite atblokuoti"
          : "Are you sure you want to unblock"
      }
      confirmDeleteText={
        locale === "lt"
          ? "Ar tikrai norite pašalinti"
          : "Are you sure you want to delete"
      }
      adminPathLabel={locale === "lt" ? "Administratorius" : "Admin"}
    />
  );
}