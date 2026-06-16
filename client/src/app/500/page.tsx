import ErrorStatePage from "@/modules/error/ErrorStatePage";

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
