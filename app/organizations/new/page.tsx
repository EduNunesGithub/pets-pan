import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { CreateOrganizationForm } from "@/components/create-organization-form";
import { RequireSession } from "@/components/require-session";

export default function Page() {
  return (
    <AuthCard kicker="Organização" title="Criar organização">
      <Suspense fallback={<p className="text-muted text-sm">Carregando…</p>}>
        <RequireSession signInRedirectTo="/organizations/new">
          <CreateOrganizationForm />
        </RequireSession>
      </Suspense>
    </AuthCard>
  );
}
