import BarcodeColorField from "./BarcodeColorField";

export default function BarcodeColorFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <BarcodeColorField
        id="barcode-bar-color"
        label="Bar color"
        name="barColor"
        defaultValue="#020617"
      />
      <BarcodeColorField
        id="barcode-background-color"
        label="Background color"
        name="backgroundColor"
        defaultValue="#ffffff"
      />
    </div>
  );
}
