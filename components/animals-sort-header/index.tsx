"use client";

import { Button } from "@base-ui/react/button";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { serializeAnimalListParams } from "@/domain/animal/list-params";
import { useAnimalListNavigation } from "@/hooks/use-animal-list-navigation";

import type {
  AnimalListParams,
  AnimalSortKey,
} from "@/domain/animal/list-params";

type AnimalsSortHeaderProps = {
  column: AnimalSortKey;
  label: string;
  params: AnimalListParams;
};

export function AnimalsSortHeader({
  column,
  label,
  params,
}: AnimalsSortHeaderProps) {
  const replace = useAnimalListNavigation();

  const active = params.sort === column;
  const nextOrder = active && params.order === "desc" ? "asc" : "desc";

  function toggle() {
    replace(
      serializeAnimalListParams({
        ...params,
        order: nextOrder,
        page: 1,
        sort: column,
      }),
    );
  }

  return (
    <Button
      className="eyebrow flex items-center gap-pair text-muted transition-colors hover:text-ink"
      onClick={toggle}
    >
      {label}

      {active ? (
        params.order === "asc" ? (
          <ArrowUp aria-hidden className="size-3" />
        ) : (
          <ArrowDown aria-hidden className="size-3" />
        )
      ) : (
        <ChevronsUpDown aria-hidden className="size-3 opacity-40" />
      )}
    </Button>
  );
}
