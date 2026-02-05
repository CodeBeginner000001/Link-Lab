"use client";

import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function AuthUserProvider({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);