import SignUp from "@/modules/auth/pages/SignUp"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a Link Lab account to start building short links, barcodes, and link utilities from one dashboard.",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Create an account | Link Lab",
    description:
      "Create a Link Lab account to start building short links, barcodes, and link utilities from one dashboard.",
    url: "/signup",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Create an account | Link Lab",
    description:
      "Create a Link Lab account to start building short links, barcodes, and link utilities from one dashboard.",
  },
};

export default function Page() {
    return <SignUp />
}
