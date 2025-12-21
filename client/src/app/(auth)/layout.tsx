import AuthVisual from "@/components/auth/AuthVisual";
import AuthNavBar from "@/modules/auth/components/AuthNavBar";
import { resolveAuthBackRoute } from "@/modules/auth/utils/resolve-auth-back-route";
import { headers } from "next/headers";
import { ReactNode } from "react";
export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const headerList = headers();
  const url = (await headerList).get("x-url");
  let pathname = "";
  let from: string | undefined;

  if(url) {
    const parsedUrl = new URL(url);
    pathname = parsedUrl.pathname;
    from = parsedUrl.searchParams.get("from") ?? undefined;
  }

  const backTo = resolveAuthBackRoute(pathname, from as any);
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-12">
        <AuthNavBar link={backTo}/>
        {children}
      </div>
      <AuthVisual />
    </div>
  );
}
