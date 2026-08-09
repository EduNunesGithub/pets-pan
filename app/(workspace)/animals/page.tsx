import Link from "next/link";

import { Button } from "@/components/button";

export default function Page() {
  return (
    <div className="flex flex-col gap-block max-w-2xl">
      <header className="flex gap-block items-start justify-between">
        <div className="flex flex-col gap-pair">
          <span className="eyebrow text-muted">Operação</span>

          <h1 className="text-ink">Animais</h1>
        </div>

        <Button nativeButton={false} render={<Link href="/animals/new" />}>
          Cadastrar animal
        </Button>
      </header>

      <section className="bg-card border border-line flex flex-col gap-section items-center px-block py-frame rounded-md text-center">
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
    </div>
  );
}
