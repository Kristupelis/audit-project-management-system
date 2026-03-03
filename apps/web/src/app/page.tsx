import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (session?.apiAccessToken) {
    redirect("/dashboard");
  }

  redirect("/login");
}