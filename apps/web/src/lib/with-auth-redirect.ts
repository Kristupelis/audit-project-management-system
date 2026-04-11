import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/api";

export async function withAuthRedirect<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }
}