import BarcodeNumberField from "./BarcodeNumberField";

export default function BarcodeMarginField() {
  return (
    <BarcodeNumberField
      id="barcode-margin"
      label="Custom margin"
      name="margin"
      defaultValue={12}
      min={0}
      max={48}
      step={2}
      description="Set the whitespace around the generated barcode."
    />
  );
}
