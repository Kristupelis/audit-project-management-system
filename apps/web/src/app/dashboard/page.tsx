import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.apiAccessToken) {
    redirect("/login");
  }

  return <DashboardClient session={session} />;
}
