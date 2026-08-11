"use client";

import { Drawer } from "@base-ui/react/drawer";
import { PanelLeft, X } from "lucide-react";

import type { ReactNode } from "react";

type WorkspaceShellProps = {
  children: ReactNode;
  sidebar: ReactNode;
};

export function WorkspaceShell({ children, sidebar }: WorkspaceShellProps) {
  return (
    <Drawer.Root swipeDirection="left">
      <div className="prose-admin flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-64 border-r border-line bg-card lg:flex lg:flex-col">
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center border-b border-line bg-card px-item lg:hidden">
            <Drawer.Trigger
              aria-label="Abrir menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-line/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              <PanelLeft aria-hidden className="size-5" />
            </Drawer.Trigger>
          </header>

          <main className="flex-1 px-item py-item sm:px-wide sm:py-wide">
            {children}
          </main>
        </div>

        <Drawer.Portal>
          <Drawer.Backdrop className="fixed inset-0 z-40 bg-ink/40 transition data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />

          <Drawer.Viewport className="fixed inset-0 z-50 flex justify-start lg:hidden">
            <Drawer.Popup className="relative flex w-72 flex-col border-r border-line bg-card transition data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
              <Drawer.Title className="sr-only">Navegação</Drawer.Title>

              <Drawer.Close
                aria-label="Fechar menu"
                className="absolute top-snug right-snug z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-line/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                <X aria-hidden className="size-4" />
              </Drawer.Close>

              {sidebar}
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </div>
    </Drawer.Root>
  );
}
