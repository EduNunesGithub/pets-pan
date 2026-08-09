"use client";

import { Field } from "@base-ui/react/field";

import { useFieldContext } from "@/components/app-form/contexts";

import type { ComponentProps } from "react";

type TextFieldProps = {
  autoComplete?: ComponentProps<"input">["autoComplete"];
  label: string;
  type?: ComponentProps<"input">["type"];
};

export function TextField({
  autoComplete,
  label,
  type = "text",
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const showError =
    field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <Field.Root
      className="flex flex-col gap-pair"
      invalid={showError}
      name={field.name}
    >
      <Field.Label className="eyebrow text-muted">{label}</Field.Label>
      <Field.Control
        autoComplete={autoComplete}
        className="h-control w-full border-b border-line bg-transparent text-base text-ink transition-colors outline-none focus:border-pine focus:shadow-field-focus"
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        type={type}
        value={field.state.value}
      />
      {showError ? (
        <Field.Error className="text-danger" match={true}>
          {field.state.meta.errors.map((error) => error.message).join(", ")}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
