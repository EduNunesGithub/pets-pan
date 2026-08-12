import { Suspense } from "react";

import { AnimalDetail } from "@/components/animal-detail";
import { AnimalDetailSkeleton } from "@/components/animal-detail-skeleton";
import { BackLink } from "@/components/back-link";
import { PageContainer } from "@/components/page-container";

export default function Page(props: PageProps<"/animals/[id]">) {
  return (
    <PageContainer>
      <div className="flex flex-col gap-block">
        <BackLink href="/animals">Animais</BackLink>

        <Suspense fallback={<AnimalDetailSkeleton />}>
          <AnimalDetail params={props.params} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
