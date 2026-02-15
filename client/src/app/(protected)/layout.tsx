import Header from "@/components/layouts/Header";
import SideBar from "@/components/layouts/SideBar";
import { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <div className="h-full">
        <SideBar />
      </div>

      {/* Right Section */}
      <div className="flex flex-col flex-1 h-full">

        {/* Header */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>

      </div>
    </div>
  );
}
