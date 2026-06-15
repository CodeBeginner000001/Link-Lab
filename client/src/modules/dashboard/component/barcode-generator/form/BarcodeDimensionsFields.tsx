import BarcodeNumberField from "./BarcodeNumberField";

export default function BarcodeDimensionsFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <BarcodeNumberField
        id="barcode-width"
        label="Bar width"
        name="barWidth"
        defaultValue={2}
        min={1}
        max={5}
      />
      <BarcodeNumberField
        id="barcode-height"
        label="Height"
        name="height"
        defaultValue={96}
        min={40}
        max={240}
        step={4}
      />
    </div>
  );
}
