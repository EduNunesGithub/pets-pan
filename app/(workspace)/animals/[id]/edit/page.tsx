import { Suspense } from "react";

import { AnimalEditor } from "@/components/animal-editor";
import { AnimalEditorSkeleton } from "@/components/animal-editor-skeleton";
import { BackLink } from "@/components/back-link";
import { PageContainer } from "@/components/page-container";

export default function Page(props: PageProps<"/animals/[id]/edit">) {
  return (
    <PageContainer>
      <div className="flex flex-col gap-block">
        <BackLink href="/animals">Animais</BackLink>

        <Suspense fallback={<AnimalEditorSkeleton />}>
          <AnimalEditor params={props.params} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
