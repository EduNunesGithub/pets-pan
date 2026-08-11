import Link from "next/link";
import { Suspense } from "react";

import { AnimalsList } from "@/components/animals-list";
import { AnimalsTableSkeleton } from "@/components/animals-table-skeleton";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/page-container";

export default function Page(props: PageProps<"/animals">) {
  return (
    <PageContainer size="wide">
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

        <Suspense fallback={<AnimalsTableSkeleton />}>
          <AnimalsList searchParams={props.searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
