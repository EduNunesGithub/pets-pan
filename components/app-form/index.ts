"use client";

import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "@/components/app-form/contexts";
import { SelectField } from "@/components/select-field";
import { TextAreaField } from "@/components/text-area-field";
import { TextField } from "@/components/text-field";

export const { useAppForm } = createFormHook({
  fieldComponents: { SelectField, TextAreaField, TextField },
  fieldContext,
  formComponents: {},
  formContext,
});
