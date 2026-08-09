"use client";

import { Field } from "@base-ui/react/field";
import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";

import { useFieldContext } from "@/components/app-form/contexts";

type SelectFieldProps = {
  label: string;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
};

export function SelectField({
  label,
  options,
  placeholder = "Não informado",
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const showError =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;
  const items = [{ label: placeholder, value: "" }, ...options];

  return (
    <Field.Root
      className="flex flex-col gap-pair"
      invalid={showError}
      name={field.name}
    >
      <Field.Label className="eyebrow text-muted">{label}</Field.Label>

      <Select.Root
        items={items}
        onValueChange={(value) => field.handleChange(value ?? "")}
        value={field.state.value}
      >
        <Select.Trigger
          className="flex h-control w-full items-center justify-between border-b border-line bg-transparent text-base text-ink transition-colors outline-none focus:border-pine focus:shadow-field-focus"
          onBlur={field.handleBlur}
        >
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

      {showError ? (
        <Field.Error className="text-danger" match={true}>
          {field.state.meta.errors.map((error) => error.message).join(", ")}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
