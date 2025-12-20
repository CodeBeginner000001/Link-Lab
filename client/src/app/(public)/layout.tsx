import AppShell from "@/src/components/layouts/AppShell";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
