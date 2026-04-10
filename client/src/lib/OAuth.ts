import type { NextAuthOptions } from "next-auth";
import GitHubProvider, { type GithubProfile } from "next-auth/providers/github";

const GITHUB_OAUTH_ISSUER = "https://github.com/login/oauth";
const GITHUB_TOKEN_URL = `${GITHUB_OAUTH_ISSUER}/access_token`;
const AUTH_PAGES = {
  signIn: "/login",
  error: "/login",
} as const;

type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
};

type GitHubCallbackParams = Record<string, string | undefined>;

const env = {
  nextAuthSecret: getRequiredEnv("NEXTAUTH_SECRET"),
  githubClientId: getRequiredEnv("GITHUB_CLIENT_ID"),
  githubClientSecret: getRequiredEnv("GITHUB_CLIENT_SECRET"),
};

function getRequiredEnv(name: "NEXTAUTH_SECRET" | "GITHUB_CLIENT_ID" | "GITHUB_CLIENT_SECRET") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for GitHub authentication.`);
  }

  return value;
}

function createGitHubTokenBody(
  params: GitHubCallbackParams,
  callbackUrl: string
) {
  const body = new URLSearchParams({
    client_id: env.githubClientId,
    client_secret: env.githubClientSecret,
    code: params.code ?? "",
    redirect_uri: callbackUrl,
  });

  if (params.state) {
    body.set("state", params.state);
  }

  if (params.code_verifier) {
    body.set("code_verifier", params.code_verifier);
  }

  return body;
}

function getGitHubTokenErrorMessage(
  response: Response,
  tokens: GitHubTokenResponse
) {
  return (
    tokens.error_description ??
    tokens.error ??
    `GitHub token exchange failed with status ${response.status}.`
  );
}

async function exchangeGitHubCodeForToken(
  params: GitHubCallbackParams,
  callbackUrl: string
): Promise<GitHubTokenResponse> {
  const body = createGitHubTokenBody(params, callbackUrl);

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  let tokens: GitHubTokenResponse;

  try {
    tokens = (await response.json()) as GitHubTokenResponse;
  } catch {
    throw new Error(
      `GitHub token exchange failed with a non-JSON response (${response.status}).`
    );
  }

  if (!response.ok || tokens.error || !tokens.access_token) {
    throw new Error(getGitHubTokenErrorMessage(response, tokens));
  }

  return tokens;
}

function syncGitHubProfile(token: Parameters<NonNullable<NextAuthOptions["callbacks"]>["jwt"]>[0]["token"], profile: GithubProfile) {
  token.githubId = String(profile.id);
  token.name = profile.name ?? token.name;
  token.email = profile.email ?? token.email;
  token.picture = profile.avatar_url ?? token.picture;
}

export const authOptions = {
  secret: env.nextAuthSecret,
  providers: [
    GitHubProvider({
      clientId: env.githubClientId,
      clientSecret: env.githubClientSecret,
      issuer: GITHUB_OAUTH_ISSUER,
      token: {
        async request({ params, provider }) {
          const tokens = await exchangeGitHubCodeForToken(
            params as GitHubCallbackParams,
            provider.callbackUrl
          );

          return { tokens };
        },
      },
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
          syncGitHubProfile(token, profile as GithubProfile);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.provider = token.provider;
      session.user.githubId = token.githubId;

      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;

      return session;
    },
  },
  pages: AUTH_PAGES,
} satisfies NextAuthOptions;
