import Link from "next/link";
import CreateComponentForm from "./create-component-form";

export default async function CreateComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="p-6 space-y-6">
      <div className="space-y-2">
        <Link className="underline text-sm" href={`/projects/${id}`}>
          ← Back to project
        </Link>
        <h1 className="text-2xl font-semibold">Create component</h1>
      </div>

      <CreateComponentForm projectId={id} />
    </main>
  );
}