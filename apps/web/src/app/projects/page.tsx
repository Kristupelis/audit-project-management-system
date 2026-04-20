import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import ProjectsHeader from "./projects-header";
import DeleteProjectButton from "./[id]/delete-project-button";
import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";

type Project = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status?: keyof ReturnType<typeof getDictionary>["enums"]["projectStatus"] | string | null;
  auditType?: keyof ReturnType<typeof getDictionary>["enums"]["auditType"] | string | null;
  priority?: keyof ReturnType<typeof getDictionary>["enums"]["priority"] | string | null;
  isLocked?: boolean;
  isOwner: boolean;
  roles: string[];
  updatedAt: string;
};

async function fetchProjects(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return [];

  return res.json();
}

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);
  const session = await getServerSession(authOptions);


  if (!session?.apiAccessToken) {
  return (
      <main className="p-6">
        <p>{t.auth.notLoggedIn}</p>
        <Link className="underline" href="/login">
          {t.auth.login}
        </Link>
      </main>
    );
  }

  const projects = await fetchProjects(session.apiAccessToken);

  function statusLabel(value?: string | null) {
    if (!value) return null;
    return t.enums.projectStatus[value as keyof typeof t.enums.projectStatus] ?? value;
  }

  function auditTypeLabel(value?: string | null) {
    if (!value) return null;
    return t.enums.auditType[value as keyof typeof t.enums.auditType] ?? value;
  }

  function priorityLabel(value?: string | null) {
    if (!value) return null;
    return t.enums.priority[value as keyof typeof t.enums.priority] ?? value;
  }

  return (
    <main className="p-6 space-y-6">
      <ProjectsHeader name={session.user?.name} systemRole={session.user?.systemRole} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium">{t.main.projects}</h2>
          <p className="text-sm opacity-70">{t.main.message}</p>
        </div>

        <Link href="/projects/create" className="border rounded-md px-3 py-2">
          {t.main.createProject}
        </Link>
      </div>

      {projects.length === 0 ? (
        <section className="border rounded-xl p-4">
          <p className="text-sm opacity-80">{t.main.noProjects}</p>
        </section>
      ) : (
        <ul className="space-y-2">
          {projects.map((p: Project) => (
            <li key={p.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {p.isLocked && !p.isOwner && session.user?.systemRole !== "SUPER_ADMIN" ? (
                    <span className="font-medium opacity-70 cursor-not-allowed">{p.name}</span>
                  ) : (
                    <Link href={`/projects/${p.id}`} className="font-medium underline">
                      {p.name}
                    </Link>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    {p.code && (
                      <span className="border rounded-full px-2 py-1">
                        {t.main.code} {p.code}
                      </span>
                    )}
                    {p.status && (
                      <span className="border rounded-full px-2 py-1">
                        {statusLabel(p.status)}
                      </span>
                    )}
                    {p.auditType && (
                      <span className="border rounded-full px-2 py-1">
                        {auditTypeLabel(p.auditType)}
                      </span>
                    )}
                    {p.priority && (
                      <span className="border rounded-full px-2 py-1">
                        {priorityLabel(p.priority)}
                      </span>
                    )}
                    {p.isLocked && (
                      <span className="border rounded-full px-2 py-1 border-red-400 text-red-700">
                        {locale === "lt" ? "Užrakintas" : "Locked"}
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-sm opacity-80">{p.description}</p>
                  )}

                  <p className="text-xs opacity-60">
                    {t.main.updated} {new Date(p.updatedAt).toLocaleString()}
                  </p>
                </div>

                <span className="text-xs border rounded-full px-2 py-1">
                  {p.isOwner ? t.roles.owner : p.roles.join(", ") || t.roles.member}
                </span>
              </div>

              {(p.isOwner || session.user?.systemRole === "SUPER_ADMIN") && (
                <div className="flex gap-2">
                  <Link href={`/projects/${p.id}/edit`}>
                    <button className="border rounded-md px-3 py-1 text-sm">
                      {t.common.edit}
                    </button>
                  </Link>

                  <DeleteProjectButton projectId={p.id} variant="list" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}