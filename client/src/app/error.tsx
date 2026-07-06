"use client"
import ErrorStatePage from "@/modules/error/ErrorStatePage";
import { Button } from "@/components/ui/Button";
import { RotateCcw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative h-dvh overflow-hidden">
      <ErrorStatePage
        code="500"
        title="Something went wrong"
        description="The page ran into an unexpected problem. You can try loading it again or return to a known area."
        secondaryLabel="Open dashboard"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-4 [@media(max-height:700px)]:bottom-8">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={reset}
          className="pointer-events-auto w-full sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
