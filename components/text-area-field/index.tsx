"use client";

import { Field } from "@base-ui/react/field";

import { useFieldContext } from "@/components/app-form/contexts";

type TextAreaFieldProps = {
  label: string;
  rows?: number;
};

export function TextAreaField({ label, rows = 4 }: TextAreaFieldProps) {
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
        className="w-full resize-y border-b border-line bg-transparent py-1.5 text-base text-ink transition-colors outline-none focus:border-pine focus:shadow-field-focus"
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        render={<textarea rows={rows} />}
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
