import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { OrganizationList } from "@/components/organization-list";
import { Skeleton } from "@/components/skeleton";

export default function Page() {
  return (
    <AuthCard kicker="Organização" title="Escolher organização">
      <Suspense fallback={<Skeleton className="h-control rounded-md w-full" />}>
        <OrganizationList />
      </Suspense>
    </AuthCard>
  );
}
