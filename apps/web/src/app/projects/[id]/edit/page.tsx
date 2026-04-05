import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch } from "@/lib/api";
import CreateProjectForm from "../../create-project-form";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";

type Project = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: "PLANNING" | "ACTIVE" | "FIELDWORK" | "REVIEW" | "CLOSED" | "ARCHIVED";
  auditType:
    | "INTERNAL"
    | "EXTERNAL"
    | "IT"
    | "FINANCIAL"
    | "COMPLIANCE"
    | "OPERATIONAL"
    | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scope: string | null;
  objective: string | null;
  methodology: string | null;
  auditedEntityName: string | null;
  location: string | null;
  engagementLead: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  isOwner: boolean;
};

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const locale: Locale = localeCookie === "lt" ? "lt" : "en";
  const t = getDictionary(locale);

  const session = await getServerSession(authOptions);
  const token = session?.apiAccessToken;

  if (!token) {
    return <main className="p-6">{t.auth.notLoggedIn}</main>;
  }

  const project = await apiFetch<Project>(`/projects/${id}`, token);

  if (!project.isOwner && session?.user?.systemRole !== "SUPER_ADMIN") {
    return (
      <main className="p-6">
        {locale === "lt"
          ? "Tik projekto savininkai arba superadministratoriai gali redaguoti projektus."
          : "Only project owners or superadmins can edit projects."}
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href={`/projects/${id}`} className="underline text-sm">
          ← {t.rolesManagement.backToProject}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">
          {t.projects.editProject}
        </h1>
      </div>

      <CreateProjectForm
        mode="edit"
        projectId={id}
        initialValues={{
          name: project.name,
          code: project.code ?? "",
          description: project.description ?? "",
          status: project.status,
          auditType: project.auditType,
          priority: project.priority,
          scope: project.scope ?? "",
          objective: project.objective ?? "",
          methodology: project.methodology ?? "",
          auditedEntityName: project.auditedEntityName ?? "",
          location: project.location ?? "",
          engagementLead: project.engagementLead ?? "",
          periodStart: toDateInput(project.periodStart),
          periodEnd: toDateInput(project.periodEnd),
          plannedStartDate: toDateInput(project.plannedStartDate),
          plannedEndDate: toDateInput(project.plannedEndDate),
          actualStartDate: toDateInput(project.actualStartDate),
          actualEndDate: toDateInput(project.actualEndDate),
        }}
      />
    </main>
  );
}