import AuthVisual from "@/components/auth/AuthVisual";
import AuthNavBarWrapper from "@/modules/auth/components/AuthNavBarWrapper";
import { ReactNode, Suspense } from "react";
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-12">
        <Suspense>
          <AuthNavBarWrapper />
        </Suspense>
        {children}
      </div>
      <AuthVisual />
    </div>
  );
}
