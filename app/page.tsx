import { Suspense } from "react";

import { SessionStatus } from "@/components/session-status";

export default function Page() {
  return (
    <main>
      <h1>pet-monorepo</h1>

      <Suspense fallback={<p>Carregando…</p>}>
        <SessionStatus />
      </Suspense>
    </main>
  );
}
