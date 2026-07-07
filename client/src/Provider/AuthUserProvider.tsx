"use client";

import type { AuthUser } from "@/service/auth/types";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = AuthUser | null;
export const AuthContext = createContext<AuthContextType>(null);

export function AuthUserProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  const [stableUser, setStableUser] = useState(user);

  useEffect(() => {
    if (user) {
      setStableUser(user);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={stableUser}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
