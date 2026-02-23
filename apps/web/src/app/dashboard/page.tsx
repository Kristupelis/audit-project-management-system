import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import DashboardClient from "./dashboard-client";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="p-6">
        <p>You are not logged in.</p>
        <Link className="underline" href="/login">Go to login</Link>
      </main>
    );
  }

  return <DashboardClient session={session} />;
}
