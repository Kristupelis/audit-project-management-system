import Link from "next/link";
import { cookies } from "next/headers";
import CreateComponentForm from "./create-component-form";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";

export default async function CreateComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-2">
        <Link className="underline text-sm" href={`/projects/${id}`}>
          ← {t.structure.backToProject}
        </Link>
        <h1 className="text-2xl font-semibold">
          {t.structure.createComponentPageTitle}
        </h1>
      </div>

      <CreateComponentForm projectId={id} />
    </main>
  );
}