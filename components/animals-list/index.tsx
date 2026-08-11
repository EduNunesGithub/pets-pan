import { listOrganizationAnimals } from "@/app/(workspace)/animals/queries";
import { AnimalsEmptyState } from "@/components/animals-empty-state";
import { AnimalsFilters } from "@/components/animals-filters";
import { AnimalsPagination } from "@/components/animals-pagination";
import { AnimalsTable } from "@/components/animals-table";
import { animalListParams } from "@/domain/animal/list-params";

type AnimalsListProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function AnimalsList({ searchParams }: AnimalsListProps) {
  const params = animalListParams.parse(await searchParams);
  const { pageCount, rows, total } = await listOrganizationAnimals(params);

  const hasFilters = Boolean(
    params.ageGroup || params.q || params.sex || params.size || params.species,
  );

  if (total === 0 && !hasFilters) {
    return <AnimalsEmptyState />;
  }

  return (
    <div className="flex flex-col gap-item">
      <AnimalsFilters params={params} />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-inset rounded-md border border-line bg-card px-block py-wide text-center">
          <p className="item text-ink">Nenhum animal encontrado.</p>

          <p className="max-w-xs text-muted">
            Ajuste a busca ou os filtros para ver outros animais.
          </p>
        </div>
      ) : (
        <AnimalsTable params={params} rows={rows} />
      )}

      {total > 0 ? (
        <AnimalsPagination
          pageCount={pageCount}
          params={params}
          total={total}
        />
      ) : null}
    </div>
  );
}
