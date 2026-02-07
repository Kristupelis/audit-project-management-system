import type { NextAuthOptions, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

interface CustomUser {
  id: string;
  email: string;
  name: string;
  apiAccessToken: string;
}

interface CustomSession extends Session {
  apiAccessToken?: string;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (!data?.user?.id || !data?.accessToken) return null;

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          apiAccessToken: data.accessToken,
        } as CustomUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.apiAccessToken = (user as CustomUser).apiAccessToken;
      return token;
    },
    async session({ session, token }) {
      const customSession = session as CustomSession;
      customSession.apiAccessToken = token.apiAccessToken as string | undefined;
      return customSession;
    },
  },
};
