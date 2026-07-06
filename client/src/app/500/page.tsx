import ErrorStatePage from "@/modules/error/ErrorStatePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server error",
  description:
    "Link Lab ran into a server problem while loading this page. Try again shortly or return to a known area.",
  alternates: {
    canonical: "/500",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Server error | Link Lab",
    description:
      "Link Lab ran into a server problem while loading this page. Try again shortly or return to a known area.",
    url: "/500",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Server error | Link Lab",
    description:
      "Link Lab ran into a server problem while loading this page. Try again shortly or return to a known area.",
  },
};

export default function ServerErrorPage() {
  return (
    <ErrorStatePage
      code="500"
      title="Something went wrong"
      description="The server hit a problem while loading this page. Try again shortly or return to a known area."
      secondaryLabel="Open dashboard"
    />
  );
}
