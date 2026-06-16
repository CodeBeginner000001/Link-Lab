import ErrorStatePage from "@/modules/error/ErrorStatePage";

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
