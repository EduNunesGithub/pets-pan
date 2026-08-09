import { RegisterAnimalForm } from "@/components/register-animal-form";

export default function Page() {
  return (
    <div className="flex flex-col gap-block max-w-2xl">
      <header className="flex flex-col gap-pair">
        <span className="eyebrow text-muted">Operação</span>

        <h1 className="text-ink">Cadastrar animal</h1>

        <p className="max-w-md text-muted">
          O animal nasce ativo e fora do marketplace. A publicação é um passo à
          parte, quando a ficha estiver pronta.
        </p>
      </header>

      <RegisterAnimalForm />
    </div>
  );
}
