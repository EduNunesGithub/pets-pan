"use client";

import { Button } from "@base-ui/react/button";
import { useRef, useState } from "react";

import { FilterSelect } from "@/components/filter-select";
import { SearchField } from "@/components/search-field";
import {
  ageGroupOptions,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "@/domain/animal/labels";
import { serializeAnimalListParams } from "@/domain/animal/list-params";
import { useAnimalListNavigation } from "@/hooks/use-animal-list-navigation";

import type { AnimalListParams } from "@/domain/animal/list-params";

const searchDelay = 300;

const selectFilters = [
  /* order: espelha a ordem dos campos no cadastro */
  { key: "species", label: "Espécie", options: speciesOptions },
  { key: "sex", label: "Sexo", options: sexOptions },
  { key: "size", label: "Porte", options: sizeOptions },
  { key: "ageGroup", label: "Faixa etária", options: ageGroupOptions },
] as const;

export function AnimalsFilters({ params }: { params: AnimalListParams }) {
  const replace = useAnimalListNavigation();
  const [query, setQuery] = useState(params.q ?? "");
  const [lastQuery, setLastQuery] = useState(params.q);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (params.q !== lastQuery) {
    setLastQuery(params.q);
    setQuery(params.q ?? "");
  }

  function replaceParam(key: string, value: string) {
    const search = serializeAnimalListParams(params);
    search.delete("page");

    if (value) {
      search.set(key, value);
    } else {
      search.delete(key);
    }

    replace(search);
  }

  function onSearchChange(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => replaceParam("q", value.trim()),
      searchDelay,
    );
  }

  function clearFilters() {
    const search = serializeAnimalListParams(params);

    for (const key of ["ageGroup", "page", "q", "sex", "size", "species"]) {
      search.delete(key);
    }

    replace(search);
  }

  const hasFilters = Boolean(
    params.ageGroup || params.q || params.sex || params.size || params.species,
  );

  return (
    <div className="flex flex-col gap-inset sm:flex-row sm:flex-wrap sm:items-end">
      <SearchField
        className="sm:min-w-56 sm:flex-1"
        label="Buscar"
        onValueChange={onSearchChange}
        placeholder="Nome do animal"
        value={query}
      />

      {selectFilters.map((filter) => (
        <FilterSelect
          key={filter.key}
          label={filter.label}
          onValueChange={(value) => replaceParam(filter.key, value)}
          options={filter.options}
          value={params[filter.key] ?? ""}
        />
      ))}

      {hasFilters ? (
        <Button
          className="eyebrow text-pine transition-colors hover:text-pine-strong"
          onClick={clearFilters}
        >
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
