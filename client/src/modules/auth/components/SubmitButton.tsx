import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export default function SubmitButton({
  buttonLabel,
  loading,
}: {
  buttonLabel: string;
  loading?: boolean;
}) {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <span>{buttonLabel}</span>
      )}
    </Button>
  );
}
