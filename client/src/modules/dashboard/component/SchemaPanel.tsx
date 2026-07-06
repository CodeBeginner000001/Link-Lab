import type { SchemaChip } from "../schema-driven/types";
import ToolFeaturePill from "./ToolFeaturePill";
import ToolPanel from "./ToolPanel";
import ToolPillGroup from "./ToolPillGroup";

type SchemaPanelProps = {
  title: string;
  description: string;
  responsiveChip?: SchemaChip;
  chips?: SchemaChip[];
  children: React.ReactNode;
};

export default function SchemaPanel({
  title,
  description,
  responsiveChip,
  chips,
  children,
}: SchemaPanelProps) {
  return (
    <ToolPanel
      heading={title}
      para={description}
      headerSlot={
        responsiveChip ? (
          <ToolFeaturePill
            icon={responsiveChip.icon}
            label={responsiveChip.label}
          />
        ) : undefined
      }
    >
      {chips?.length ? (
        <ToolPillGroup className="mb-5">
          {chips.map((chip) => (
            <ToolFeaturePill
              key={chip.label}
              icon={chip.icon}
              label={chip.label}
            />
          ))}
        </ToolPillGroup>
      ) : null}
      {children}
    </ToolPanel>
  );
}
