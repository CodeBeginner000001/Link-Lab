import HomePage from "@/modules/home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Short links, barcodes, and QR tools",
  description:
    "Link Lab is a digital toolkit for creating short links, generating barcodes, and managing useful link workflows.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "URL shortener",
    "short links",
    "barcode generator",
    "QR tools",
    "Link Lab",
  ],
  openGraph: {
    title: "Link Lab | Short links, barcodes, and QR tools",
    description:
      "Create short links, generate barcodes, and manage useful link workflows with Link Lab.",
    url: "/",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Link Lab | Short links, barcodes, and QR tools",
    description:
      "Create short links, generate barcodes, and manage useful link workflows with Link Lab.",
  },
};

export default function Page() {
  return (
    <HomePage/>
  );
}
