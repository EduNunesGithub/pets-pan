import { Button } from "@/components/button";

export default function Page() {
  return (
    <div className="flex flex-col gap-block max-w-2xl">
      <header className="flex flex-col gap-pair">
        <span className="eyebrow text-muted">Operação</span>

        <h1 className="text-ink">Animais</h1>
      </header>

      <section className="bg-card border border-line flex flex-col gap-section items-center px-block py-frame rounded-md text-center">
        <div className="flex flex-col gap-pair">
          <p className="item text-ink">Nenhum animal ainda.</p>

          <p className="max-w-xs text-muted">
            Quando o cadastro chegar, os animais da organização aparecem aqui.
          </p>
        </div>

        <Button disabled type="button">
          Cadastrar animal
        </Button>

        <span className="eyebrow text-muted">em breve</span>
      </section>
    </div>
  );
}
