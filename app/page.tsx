import { Suspense } from "react";

import { SessionStatus } from "@/components/session-status";
import { Skeleton } from "@/components/skeleton";

export default function Page() {
  return (
    <main>
      <h1>pet-monorepo</h1>

      <Suspense fallback={<Skeleton className="w-56 rounded-sm text-base" />}>
        <SessionStatus />
      </Suspense>
    </main>
  );
}
