import { Button } from "@/components/button";

export default function Page() {
  return (
    <div className="flex flex-col gap-block max-w-2xl">
      <header className="flex flex-col gap-pair">
        <span className="font-mono text-muted text-xs tracking-widest uppercase">
          Operação
        </span>

        <h1 className="font-semibold text-2xl text-ink tracking-tight">
          Animais
        </h1>
      </header>

      <section className="bg-card border border-line flex flex-col gap-section items-center px-block py-frame rounded-md text-center">
        <div className="flex flex-col gap-pair">
          <p className="font-medium text-ink text-sm">Nenhum animal ainda.</p>

          <p className="max-w-xs text-muted text-sm">
            Quando o cadastro chegar, os animais da organização aparecem aqui.
          </p>
        </div>

        <Button disabled type="button">
          Cadastrar animal
        </Button>

        <span className="font-mono text-muted text-xs tracking-widest uppercase">
          em breve
        </span>
      </section>
    </div>
  );
}
