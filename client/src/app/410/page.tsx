import ErrorStatePage from "@/modules/error/ErrorStatePage";

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
