import type { NextAuthOptions, Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

interface CustomUser {
  id: string;
  email: string;
  name: string;
  apiAccessToken: string;
  apiAccessExpiresAt: number | null;
  systemRole?: string | null;
}

interface CustomSession extends Session {
  apiAccessToken?: string;
  apiAccessExpiresAt?: number | null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        accessToken: { label: 'AccessToken', type: 'text' },
        userId: { label: 'UserId', type: 'text' },
        name: { label: 'Name', type: 'text' },
        systemRole: { label: 'SystemRole', type: 'text' },
        accessExpiresAt: { label: 'AccessExpiresAt', type: 'text' },
      },
      async authorize(credentials) {
        // Session creation after successful 2FA/setup
        if (
          credentials?.accessToken &&
          credentials?.email &&
          credentials?.userId
        ) {
          return {
            id: credentials.userId,
            email: credentials.email,
            name: credentials.name ?? '',
            systemRole: credentials.systemRole ?? null,
            apiAccessToken: credentials.accessToken,
            apiAccessExpiresAt: credentials.accessExpiresAt ? Number(credentials.accessExpiresAt) : null,
          } as CustomUser;
        }

        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) return null;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const text = await res.text();
        let data: Record<string, unknown> = {};

        try {
          data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          data = {};
        }

        if (!res.ok) {
          const message =
            typeof data.message === 'string'
              ? data.message
              : text || 'Login failed';

          throw new Error(message);
        }

        if (data.requiresTwoFactorSetup) {
          throw new Error(
            `2FA_SETUP_REQUIRED:${String(data.userId)}:${String(data.email ?? email)}`,
          );
        }

        if (data.requiresTwoFactor) {
          throw new Error(
            `2FA_REQUIRED:${String(data.userId)}:${String(data.email ?? email)}`,
          );
        }

        const user = data.user as Record<string, unknown> | undefined;

        if (!user?.id || !data.accessToken) return null;

        return {
          id: String(user.id),
          email: String(user.email),
          name: String(user.name ?? ''),
          systemRole: (user.systemRole as string | null | undefined) ?? null,
          apiAccessToken: String(data.accessToken),
          apiAccessExpiresAt:
            (data.accessExpiresAt as number | null | undefined) ?? null,
        } as CustomUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.systemRole = (user as CustomUser).systemRole ?? null;
        token.apiAccessToken = (user as CustomUser).apiAccessToken;
        token.apiAccessExpiresAt = (user as CustomUser).apiAccessExpiresAt;
      }

      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        email: token.email as string,
        name: token.name as string,
        systemRole: (token.systemRole as string | null | undefined) ?? null,
      };

      (session as CustomSession).apiAccessToken = token.apiAccessToken as
        | string
        | undefined;

      (session as CustomSession).apiAccessExpiresAt =
        (token.apiAccessExpiresAt as number | null | undefined) ?? null;

      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};