import Link from "next/link";

import { Button } from "@/components/button";

export function AnimalsEmptyState() {
  return (
    <section className="flex flex-col items-center gap-section rounded-md border border-line bg-card px-block py-frame text-center">
      <div className="flex flex-col gap-pair">
        <p className="item text-ink">Nenhum animal ainda.</p>

        <p className="max-w-xs text-muted">
          Cadastre o primeiro animal da organização para começar.
        </p>
      </div>

      <Button nativeButton={false} render={<Link href="/animals/new" />}>
        Cadastrar animal
      </Button>
    </section>
  );
}
