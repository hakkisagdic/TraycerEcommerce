import type { DefaultSession, NextAuthConfig } from "next-auth";

export type AppRole = "admin" | "reader";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    role?: AppRole;
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as { id: string }).id;
        token.role = ((user as { role?: AppRole }).role ?? "reader") as AppRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
      }
      session.user.role = (token.role ?? "reader") as AppRole;
      return session;
    },
  },
} satisfies NextAuthConfig;
