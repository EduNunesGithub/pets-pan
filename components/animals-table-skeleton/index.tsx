import { twMerge } from "tailwind-merge";

import { Skeleton } from "@/components/skeleton";

const filters = [
  /* order: espelha a ordem dos campos no cadastro */
  { key: "species", label: "w-16" },
  { key: "sex", label: "w-12" },
  { key: "size", label: "w-14" },
  { key: "ageGroup", label: "w-24" },
];

const columns = [
  /* order: ordem de exibição das colunas */
  { body: "w-28 text-sm", header: "w-12", key: "name" },
  { body: "w-16 text-sm", header: "w-16", key: "species" },
  {
    body: "w-16 text-sm",
    className: "hidden md:table-cell",
    header: "w-12",
    key: "sex",
  },
  {
    body: "w-16 text-sm",
    className: "hidden sm:table-cell",
    header: "w-14",
    key: "size",
  },
  {
    body: "w-16 text-sm",
    className: "hidden lg:table-cell",
    header: "w-20",
    key: "ageGroup",
  },
  { badge: true, header: "w-20", key: "published" },
  {
    align: true,
    body: "w-20 text-xs",
    className: "hidden sm:table-cell",
    header: "w-24",
    key: "createdAt",
  },
];

export function AnimalsTableSkeleton() {
  return (
    <div className="flex flex-col gap-item">
      <div className="flex flex-col gap-inset sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-pair sm:min-w-56 sm:flex-1">
          <Skeleton className="w-14 rounded-sm text-xs" />
          <Skeleton className="h-control w-full rounded-md" />
        </div>

        {filters.map((filter) => (
          <div className="flex flex-col gap-pair" key={filter.key}>
            <Skeleton className={twMerge("rounded-sm text-xs", filter.label)} />
            <Skeleton className="h-control w-44 rounded-md" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {columns.map((column) => (
                  <th
                    className={twMerge(
                      "h-9 px-inset align-middle",
                      column.align && "text-right",
                      column.className,
                    )}
                    key={column.key}
                  >
                    <Skeleton
                      className={twMerge(
                        "rounded-sm text-xs",
                        column.header,
                        column.align && "ml-auto",
                      )}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 8 }, (_, index) => (
                <tr
                  className="border-b border-line/50 last:border-0"
                  key={index}
                >
                  {columns.map((column) => (
                    <td
                      className={twMerge(
                        "h-13 px-inset align-middle",
                        column.align && "text-right",
                        column.className,
                      )}
                      key={column.key}
                    >
                      {column.badge ? (
                        <Skeleton className="w-20 rounded-full py-pair text-xs" />
                      ) : (
                        <Skeleton
                          className={twMerge(
                            "rounded-sm",
                            column.body,
                            column.align && "ml-auto",
                          )}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-inset">
        <Skeleton className="w-24 rounded-sm text-xs" />

        <div className="flex items-center gap-snug">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="w-28 rounded-sm text-xs" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
