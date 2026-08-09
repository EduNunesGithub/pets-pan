"use client";

import { usePathname } from "next/navigation";

import { WorkspaceNavItem } from "@/components/workspace-nav-item";

export function WorkspaceNav({ canGovern }: { canGovern: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-block overflow-y-auto px-snug py-item">
      <div className="flex flex-col gap-snug">
        <span className="eyebrow px-inset text-muted">Operação</span>

        <WorkspaceNavItem
          active={pathname === "/animals"}
          href="/animals"
          label="Animais"
        />

        <WorkspaceNavItem label="Cases" upcoming />

        <WorkspaceNavItem label="Candidaturas" upcoming />
      </div>

      {canGovern ? (
        <div className="flex flex-col gap-snug">
          <span className="eyebrow px-inset text-muted">Administração</span>

          <WorkspaceNavItem label="Membros" upcoming />

          <WorkspaceNavItem label="Configuração" upcoming />
        </div>
      ) : null}
    </nav>
  );
}
