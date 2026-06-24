import ErrorStatePage from "@/modules/error/ErrorStatePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page no longer available",
  description:
    "This Link Lab page is no longer available. Return home or open your dashboard to continue.",
  alternates: {
    canonical: "/410",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Page no longer available | Link Lab",
    description:
      "This Link Lab page is no longer available. Return home or open your dashboard to continue.",
    url: "/410",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Page no longer available | Link Lab",
    description:
      "This Link Lab page is no longer available. Return home or open your dashboard to continue.",
  },
};

export default function GonePage() {
  return (
    <ErrorStatePage
      code="410"
      title="This page is gone"
      description="This link is no longer available. Head back home or open your dashboard to continue."
      secondaryLabel="Open dashboard"
    />
  );
}
