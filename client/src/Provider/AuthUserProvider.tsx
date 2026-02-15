"use client";

import { createContext, useContext } from "react";

interface UserProp {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
type AuthContextType = UserProp | null;
export const AuthContext = createContext<AuthContextType>(null);

export function AuthUserProvider({
  user,
  children,
}: {
  user: UserProp | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
