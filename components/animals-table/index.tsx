import { twMerge } from "tailwind-merge";

import { AnimalVisibilityBadge } from "@/components/animal-visibility-badge";
import { AnimalsSortHeader } from "@/components/animals-sort-header";
import {
  ageGroupOptions,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "@/domain/animal/labels";

import type { Animal } from "@/db/schema/animals";
import type {
  AnimalListParams,
  AnimalSortKey,
} from "@/domain/animal/list-params";
import type { ReactNode } from "react";

type AnimalColumn = {
  align?: "end";
  cell: (animal: Animal) => ReactNode;
  className?: string;
  header: string;
  sort?: AnimalSortKey;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
  year: "numeric",
});

function optionLabel(
  options: readonly { label: string; value: string }[],
  value: null | string,
): string {
  if (!value) {
    return "—";
  }

  return options.find((option) => option.value === value)?.label ?? "—";
}

const columns: AnimalColumn[] = [
  /* order: ordem de exibição das colunas */
  {
    cell: (animal) =>
      animal.name ? (
        <span className="item text-ink">{animal.name}</span>
      ) : (
        <span className="text-muted italic">Sem nome</span>
      ),
    header: "Nome",
    sort: "name",
  },
  {
    cell: (animal) => optionLabel(speciesOptions, animal.species),
    header: "Espécie",
  },
  {
    cell: (animal) => optionLabel(sexOptions, animal.sex),
    className: "hidden md:table-cell",
    header: "Sexo",
  },
  {
    cell: (animal) => optionLabel(sizeOptions, animal.size),
    className: "hidden sm:table-cell",
    header: "Porte",
  },
  {
    cell: (animal) => optionLabel(ageGroupOptions, animal.ageGroup),
    className: "hidden lg:table-cell",
    header: "Faixa etária",
  },
  {
    cell: (animal) => <AnimalVisibilityBadge published={animal.published} />,
    header: "Visibilidade",
  },
  {
    align: "end",
    cell: (animal) => (
      <span className="meta text-muted">
        {dateFormatter.format(animal.createdAt)}
      </span>
    ),
    className: "hidden sm:table-cell",
    header: "Cadastrado em",
    sort: "createdAt",
  },
];

export function AnimalsTable({
  params,
  rows,
}: {
  params: AnimalListParams;
  rows: Animal[];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => (
                <th
                  className={twMerge(
                    "h-9 px-inset align-middle whitespace-nowrap",
                    column.align === "end" && "text-right",
                    column.className,
                  )}
                  key={column.header}
                >
                  {column.sort ? (
                    <AnimalsSortHeader
                      column={column.sort}
                      label={column.header}
                      params={params}
                    />
                  ) : (
                    <span className="eyebrow text-muted">{column.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((animal) => (
              <tr
                className="border-b border-line/50 text-sm transition-colors last:border-0 hover:bg-line/20"
                key={animal.id}
              >
                {columns.map((column) => (
                  <td
                    className={twMerge(
                      "h-13 px-inset align-middle whitespace-nowrap text-ink",
                      column.align === "end" && "text-right",
                      column.className,
                    )}
                    key={column.header}
                  >
                    {column.cell(animal)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
