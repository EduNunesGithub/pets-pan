import { Suspense } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { WorkspaceSidebarFallback } from "@/components/workspace-sidebar-fallback";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <WorkspaceShell
      sidebar={
        <Suspense fallback={<WorkspaceSidebarFallback />}>
          <WorkspaceSidebar />
        </Suspense>
      }
    >
      {children}
    </WorkspaceShell>
  );
}
