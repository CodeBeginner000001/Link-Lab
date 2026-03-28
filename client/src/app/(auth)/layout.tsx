import AuthVisual from "@/components/auth/AuthVisual";
import { GetCurrentUser } from "@/service/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const user = accessToken ? await GetCurrentUser(accessToken) : null;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-10">
        {children}
      </div>
      <AuthVisual />
    </div>
  );
}
