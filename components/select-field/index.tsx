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
          className="bg-transparent border-b border-line flex h-control items-center justify-between outline-none text-base text-ink transition-colors w-full focus:border-pine focus:shadow-field-focus"
          onBlur={field.handleBlur}
        >
          <Select.Value />

          <Select.Icon>
            <ChevronsUpDown
              aria-hidden
              className="shrink-0 size-4 text-muted"
            />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner align="start" sideOffset={4}>
            <Select.Popup className="bg-card border border-line flex flex-col gap-pair min-w-(--anchor-width) p-pair prose-admin rounded-md shadow-card transition data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
              {items.map((item) => (
                <Select.Item
                  className="cursor-pointer flex gap-inset items-center justify-between px-inset py-snug rounded-sm transition-colors data-highlighted:bg-pine data-highlighted:text-paper"
                  key={item.value}
                  value={item.value}
                >
                  <Select.ItemText>{item.label}</Select.ItemText>

                  <Select.ItemIndicator>
                    <Check aria-hidden className="shrink-0 size-4" />
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
