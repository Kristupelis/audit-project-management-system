import Link from "next/link";
import CreateProjectForm from "../create-project-form";

export default function CreateProjectPage() {
  return (
    <main className="p-6 space-y-6">
      <div>
        <Link href="/projects" className="underline text-sm">
          ← Back to projects
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Create project</h1>
      </div>

      <CreateProjectForm />
    </main>
  );
}