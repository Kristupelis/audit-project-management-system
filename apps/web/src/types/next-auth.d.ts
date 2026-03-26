import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    apiAccessToken?: string;
    apiAccessExpiresAt?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiAccessToken?: string;
    apiAccessExpiresAt?: number | null;
  }
}