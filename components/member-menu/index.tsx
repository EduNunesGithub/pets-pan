"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/client";

import type { Role } from "@/domain/member/role";

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  volunteer: "Voluntário",
};

export function MemberMenu({
  email,
  name,
  role,
}: {
  email: string;
  name: string;
  role: Role;
}) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-snug border-t border-line p-item">
      <span className="eyebrow text-muted">{roleLabels[role]}</span>

      <Menu.Root>
        <Menu.Trigger className="flex h-control w-full items-center gap-inset rounded-md border border-line bg-card px-inset text-left transition-colors hover:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
          <span className="item min-w-0 flex-1 truncate text-ink">{name}</span>

          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="start" side="top" sideOffset={4}>
            <Menu.Popup className="prose-admin flex min-w-56 origin-bottom flex-col gap-pair rounded-md border border-line bg-card p-pair shadow-card transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              <span className="flex flex-col gap-pair px-inset py-snug">
                <span className="eyebrow text-muted">Sessão</span>

                <span className="text-ink">{email}</span>
              </span>

              <Menu.Item
                className="flex cursor-pointer items-center gap-inset rounded-sm px-inset py-snug text-left transition-colors data-highlighted:bg-pine data-highlighted:text-paper"
                onClick={signOut}
              >
                <LogOut aria-hidden className="size-4 shrink-0" />
                Sair
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
