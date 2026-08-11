"use client";

import { PaginationControls } from "@/components/pagination-controls";
import { serializeAnimalListParams } from "@/domain/animal/list-params";
import { useAnimalListNavigation } from "@/hooks/use-animal-list-navigation";

import type { AnimalListParams } from "@/domain/animal/list-params";

type AnimalsPaginationProps = {
  pageCount: number;
  params: AnimalListParams;
  total: number;
};

export function AnimalsPagination({
  pageCount,
  params,
  total,
}: AnimalsPaginationProps) {
  const replace = useAnimalListNavigation();

  function goToPage(page: number) {
    replace(serializeAnimalListParams({ ...params, page }));
  }

  return (
    <PaginationControls
      canNextPage={params.page < pageCount}
      canPreviousPage={params.page > 1}
      onNextPage={() => goToPage(params.page + 1)}
      onPreviousPage={() => goToPage(params.page - 1)}
      pageCount={pageCount}
      pageIndex={params.page - 1}
      rowCount={total}
    />
  );
}
