"use client";

import { usePathname } from "next/navigation";

import { WorkspaceNavItem } from "@/components/workspace-nav-item";

export function WorkspaceNav({ canGovern }: { canGovern: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-block px-snug py-item">
      <div className="flex flex-col gap-snug">
        <span className="font-mono px-inset text-muted text-xs tracking-widest uppercase">
          Operação
        </span>

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
          <span className="font-mono px-inset text-muted text-xs tracking-widest uppercase">
            Administração
          </span>

          <WorkspaceNavItem label="Membros" upcoming />

          <WorkspaceNavItem label="Configuração" upcoming />
        </div>
      ) : null}
    </nav>
  );
}
