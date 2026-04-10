import type { NextAuthOptions } from "next-auth";
import GitHubProvider, { type GithubProfile } from "next-auth/providers/github";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const clientId = requireEnv("GITHUB_CLIENT_ID");
const clientSecret = requireEnv("GITHUB_CLIENT_SECRET");

async function fetchGitHubToken(
  params: Record<string, string | undefined>,
  callbackUrl: string
) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: params.code ?? "",
    redirect_uri: callbackUrl,
  });

  if (params.state) body.set("state", params.state);
  if (params.code_verifier) body.set("code_verifier", params.code_verifier);

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const tokens = await res.json().catch(() => {
    throw new Error(`GitHub token exchange failed with a non-JSON response (${res.status}).`);
  });

  if (!res.ok || tokens.error || !tokens.access_token) {
    throw new Error(tokens.error_description ?? tokens.error ?? `GitHub token exchange failed (${res.status}).`);
  }

  return tokens;
}

export const authOptions = {
  secret: requireEnv("NEXTAUTH_SECRET"),
  providers: [
    GitHubProvider({
      clientId,
      clientSecret,
      issuer: "https://github.com/login/oauth",
      token: {
        async request({ params, provider }) {
          const tokens = await fetchGitHubToken(
            params as Record<string, string | undefined>,
            provider.callbackUrl
          );
          return { tokens };
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github") {
        token.provider = "github";
        token.providerAccountId = account.providerAccountId;

        if (profile) {
          const p = profile as GithubProfile;
          token.githubId = String(p.id);
          token.name = p.name ?? token.name;
          token.email = p.email ?? token.email;
          token.picture = p.avatar_url ?? token.picture;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.provider = token.provider;
        session.user.githubId = token.githubId;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
} satisfies NextAuthOptions;
