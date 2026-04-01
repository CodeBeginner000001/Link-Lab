"use client";

import type { AuthUser } from "@/service/auth/types";
import { createContext, useContext } from "react";

type AuthContextType = AuthUser | null;
export const AuthContext = createContext<AuthContextType>(null);

export function AuthUserProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
