import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    apiAccessToken?: string;
    apiAccessExpiresAt?: number | null;
    user?: {
      email?: string | null;
      name?: string | null;
      systemRole?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiAccessToken?: string;
    apiAccessExpiresAt?: number | null;
    systemRole?: string | null;
    sessionVersion?: number | null;
  }
}