import { AuthCard } from "@/components/auth-card";
import { CreateOrganizationForm } from "@/components/create-organization-form";

export default function Page() {
  return (
    <AuthCard kicker="Organização" title="Criar organização">
      <CreateOrganizationForm />
    </AuthCard>
  );
}
