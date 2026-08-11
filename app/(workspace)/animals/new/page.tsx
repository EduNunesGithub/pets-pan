import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/page-container";
import { RegisterAnimalForm } from "@/components/register-animal-form";

export default function Page() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-block">
        <header className="flex flex-col gap-snug">
          <Link
            className="flex w-fit items-center gap-pair text-muted transition-colors hover:text-pine"
            href="/animals"
          >
            <ArrowLeft aria-hidden className="size-4" />
            <span className="item">Animais</span>
          </Link>

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
