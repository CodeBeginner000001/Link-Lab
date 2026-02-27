// app/(protected)/layout.tsx
import { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { GetCurrentUser } from "@/service/auth/auth.server";
import Header from "@/components/layouts/Header";
import SideBar from "@/components/layouts/SideBar";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const user = await GetCurrentUser();

  if (!user && !refreshToken) {
    redirect("/login");
  }

  if (!user && refreshToken) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") || "/dashboard";

    redirect(`/refresh?redirect=${encodeURIComponent(pathname)}`);
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
