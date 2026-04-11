import ProtectedShell from "@/components/layouts/ProtectedShell";
import { GetCurrentUser } from "@/service/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const user = accessToken ? await GetCurrentUser(accessToken) : null;

  if (!user) {
    redirect("/login");
  }

  return <ProtectedShell>{children}</ProtectedShell>;
}
