"use client";

import { Field } from "@base-ui/react/field";
import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";

type FilterSelectProps = {
  label: string;
  onValueChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  value: string;
};

export function FilterSelect({
  label,
  onValueChange,
  options,
  value,
}: FilterSelectProps) {
  const items = [{ label: "Todos", value: "" }, ...options];

  return (
    <Field.Root className="flex flex-col gap-pair">
      <Field.Label className="eyebrow text-muted">{label}</Field.Label>

      <Select.Root
        items={items}
        onValueChange={(next) => onValueChange(next ?? "")}
        value={value}
      >
        <Select.Trigger className="flex h-control min-w-44 items-center justify-between gap-inset rounded-md border border-line bg-card px-inset text-sm text-ink transition-colors hover:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
          <Select.Value />

          <Select.Icon>
            <ChevronsUpDown
              aria-hidden
              className="size-4 shrink-0 text-muted"
            />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner align="start" sideOffset={4}>
            <Select.Popup className="prose-admin flex min-w-(--anchor-width) flex-col gap-pair rounded-md border border-line bg-card p-pair shadow-card transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              {items.map((item) => (
                <Select.Item
                  className="flex cursor-pointer items-center justify-between gap-inset rounded-sm px-inset py-snug transition-colors data-highlighted:bg-pine data-highlighted:text-paper"
                  key={item.value}
                  value={item.value}
                >
                  <Select.ItemText>{item.label}</Select.ItemText>

                  <Select.ItemIndicator>
                    <Check aria-hidden className="size-4 shrink-0" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}
