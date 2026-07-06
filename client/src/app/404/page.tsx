import ErrorStatePage from "@/modules/error/ErrorStatePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The Link Lab page you are looking for does not exist or may have been moved.",
  alternates: {
    canonical: "/404",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Page not found | Link Lab",
    description:
      "The Link Lab page you are looking for does not exist or may have been moved.",
    url: "/404",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Page not found | Link Lab",
    description:
      "The Link Lab page you are looking for does not exist or may have been moved.",
  },
};

export default function NotFoundPage() {
  return (
    <ErrorStatePage
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist or may have been moved."
      secondaryLabel="Open dashboard"
    />
  );
}
