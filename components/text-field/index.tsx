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
      <Field.Label className="font-mono text-muted text-xs tracking-widest uppercase">
        {label}
      </Field.Label>
      <Field.Control
        autoComplete={autoComplete}
        className="bg-transparent border-b border-line h-control outline-none text-base text-ink transition-colors w-full focus:border-pine focus:shadow-field-focus"
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        type={type}
        value={field.state.value}
      />
      {showError ? (
        <Field.Error className="text-danger text-sm" match={true}>
          {field.state.meta.errors.map((error) => error.message).join(", ")}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
