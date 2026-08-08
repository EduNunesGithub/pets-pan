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
    <div className="border-line border-t flex flex-col gap-snug p-item">
      <span className="eyebrow text-muted">{roleLabels[role]}</span>

      <Menu.Root>
        <Menu.Trigger className="bg-card border border-line flex gap-inset h-control items-center px-inset rounded-md text-left transition-colors w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine hover:border-pine">
          <span className="flex-1 item min-w-0 text-ink truncate">{name}</span>

          <ChevronsUpDown aria-hidden className="shrink-0 size-4 text-muted" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="start" side="top" sideOffset={4}>
            <Menu.Popup className="bg-card border border-line flex flex-col gap-pair min-w-56 origin-bottom p-pair prose-admin rounded-md shadow-card transition data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
              <span className="flex flex-col gap-pair px-inset py-snug">
                <span className="eyebrow text-muted">Sessão</span>

                <span className="text-ink">{email}</span>
              </span>

              <Menu.Item
                className="cursor-pointer flex gap-inset items-center px-inset py-snug rounded-sm text-left transition-colors data-highlighted:bg-pine data-highlighted:text-paper"
                onClick={signOut}
              >
                <LogOut aria-hidden className="shrink-0 size-4" />
                Sair
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
