import Login from "@/modules/auth/pages/Login"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Log in to your Link Lab account to manage short links, barcodes, and dashboard tools.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Log in | Link Lab",
    description:
      "Log in to your Link Lab account to manage short links, barcodes, and dashboard tools.",
    url: "/login",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Log in | Link Lab",
    description:
      "Log in to your Link Lab account to manage short links, barcodes, and dashboard tools.",
  },
};

export default function Page() {
    return <Login />
}
