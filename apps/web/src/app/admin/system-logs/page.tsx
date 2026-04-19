import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";
import AdminSystemLogsPage from "./system-logs-page";

export default async function Page() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  return (
    <AdminSystemLogsPage
      backLabel={t.projects.backToProjects}
      title={locale === "lt" ? "Sistemos žurnalai" : "System logs"}
      subtitle={
        locale === "lt"
          ? "Visi sistemos lygio įvykiai ir klaidos."
          : "All system-level events and errors."
      }
      loadingLabel={t.common.loading}
      errorLabel={t.common.error}
      closeLabel={t.common.close}
    />
  );
}