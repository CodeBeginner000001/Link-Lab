import { Button } from "@/components/ui/Button";
import { Barcode, Loader2, Sparkles } from "lucide-react";

export default function BarcodeGenerateButton({
  isLoading,
  disabled,
}: {
  isLoading: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={isLoading || disabled}
      className="h-11 w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Generate Barcode
          <Barcode className="ml-auto h-4 w-4 opacity-70" />
        </>
      )}
    </Button>
  );
}
