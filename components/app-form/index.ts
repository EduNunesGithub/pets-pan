"use client";

import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "@/components/app-form/contexts";
import { TextField } from "@/components/text-field";

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField },
  fieldContext,
  formComponents: {},
  formContext,
});
