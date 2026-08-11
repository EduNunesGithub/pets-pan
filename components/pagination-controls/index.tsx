"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { IconButton } from "@/components/icon-button";

type PaginationControlsProps = {
  canNextPage: boolean;
  canPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  pageCount: number;
  pageIndex: number;
  rowCount: number;
};

export function PaginationControls({
  canNextPage,
  canPreviousPage,
  onNextPage,
  onPreviousPage,
  pageCount,
  pageIndex,
  rowCount,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gap-inset">
      <span className="meta text-muted">
        {rowCount} {rowCount === 1 ? "animal" : "animais"}
      </span>

      <div className="flex items-center gap-snug">
        <IconButton
          aria-label="Página anterior"
          disabled={!canPreviousPage}
          onClick={onPreviousPage}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </IconButton>

        <span className="meta text-muted">
          Página {pageIndex + 1} de {Math.max(pageCount, 1)}
        </span>

        <IconButton
          aria-label="Próxima página"
          disabled={!canNextPage}
          onClick={onNextPage}
        >
          <ChevronRight aria-hidden className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}
