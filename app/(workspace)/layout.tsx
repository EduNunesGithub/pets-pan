import { Suspense } from "react";

import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { WorkspaceSidebarFallback } from "@/components/workspace-sidebar-fallback";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <aside className="bg-card border-line border-r flex flex-col h-dvh sticky top-0 w-64">
        <Suspense fallback={<WorkspaceSidebarFallback />}>
          <WorkspaceSidebar />
        </Suspense>
      </aside>

      <main className="flex-1 px-wide py-wide">{children}</main>
    </div>
  );
}
