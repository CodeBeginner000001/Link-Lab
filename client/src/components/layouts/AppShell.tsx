import Footer from "./Footer";
import NavBar from "./NavBar";

export default function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
