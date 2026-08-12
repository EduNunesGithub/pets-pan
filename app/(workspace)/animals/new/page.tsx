import { BackLink } from "@/components/back-link";
import { PageContainer } from "@/components/page-container";
import { RegisterAnimalForm } from "@/components/register-animal-form";

export default function Page() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-block">
        <header className="flex flex-col gap-snug">
          <BackLink href="/animals">Animais</BackLink>

          <div className="flex flex-col gap-pair">
            <h1 className="text-ink">Cadastrar animal</h1>

            <p className="max-w-md text-muted">
              O animal nasce ativo e fora do marketplace. A publicação é um
              passo à parte, quando a ficha estiver pronta.
            </p>
          </div>
        </header>

        <RegisterAnimalForm />
      </div>
    </PageContainer>
  );
}
