// app/(protected)/layout.tsx
import Header from "@/components/layouts/Header";
import SideBar from "@/components/layouts/SideBar";
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

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <SideBar />
      <div className="ml-20 min-h-screen transition-[margin] duration-300 ease-in-out peer-hover/sidebar:ml-64">
        <Header />
        <main className="pt-20 pb-4 px-6">{children}</main>
      </div>
    </div>
  );
}
