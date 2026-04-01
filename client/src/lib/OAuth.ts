import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github") {
        token.provider = "github";
        token.providerAccountId = account.providerAccountId;

        if (profile) {
          token.githubId = String((profile as { id?: string | number }).id ?? "");
          token.name = profile.name ?? token.name;
          token.email = profile.email ?? token.email;
          token.picture =
            (profile as { avatar_url?: string }).avatar_url ?? token.picture;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { provider?: string }).provider = token.provider as string;
        (session.user as { githubId?: string }).githubId = token.githubId as string;

        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};