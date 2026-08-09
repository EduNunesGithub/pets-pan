import Link from "next/link";

import { Button } from "@/components/button";

export default function Page() {
  return (
    <div className="flex flex-col gap-block">
      <header className="flex items-start justify-between gap-block">
        <div className="flex flex-col gap-pair">
          <span className="eyebrow text-muted">Operação</span>

          <h1 className="text-ink">Animais</h1>
        </div>

        <Button nativeButton={false} render={<Link href="/animals/new" />}>
          Cadastrar animal
        </Button>
      </header>

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
    </div>
  );
}
