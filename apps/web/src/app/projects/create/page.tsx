import Link from "next/link";
import { cookies } from "next/headers";
import CreateProjectForm from "../create-project-form";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";

export default async function CreateProjectPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href="/projects" className="underline text-sm">
          ← {t.projects.backToProjects}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">
          {t.projects.createProject}
        </h1>
      </div>

      <CreateProjectForm />
    </main>
  );
}