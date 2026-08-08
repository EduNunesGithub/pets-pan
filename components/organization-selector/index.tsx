"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/client";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

type OrganizationOption = {
  id: string;
  location: string | null;
  name: string;
};

export function OrganizationSelector({
  organizations,
}: {
  organizations: OrganizationOption[];
}) {
  const router = useRouter();
  const { redirectTo } = useAuthRedirect();

  const mutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        throw new Error(
          error.message ?? "Não foi possível entrar na organização.",
        );
      }
    },
    onSuccess: () => {
      router.push(redirectTo === "/" ? "/animals" : redirectTo);
    },
  });

  return (
    <div className="flex flex-col gap-block">
      <ul className="flex flex-col gap-item">
        {organizations.map((organization) => {
          const isSelecting =
            mutation.isPending && mutation.variables === organization.id;

          return (
            <li key={organization.id}>
              <button
                className="bg-card border border-line flex flex-col gap-pair items-start px-item py-item rounded-md text-left transition-colors w-full disabled:cursor-not-allowed disabled:opacity-60 hover:border-pine"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(organization.id)}
                type="button"
              >
                <span className="font-medium text-ink text-sm">
                  {organization.name}
                </span>

                {isSelecting ? (
                  <span className="font-mono text-muted text-xs">
                    Entrando…
                  </span>
                ) : organization.location ? (
                  <span className="font-mono text-muted text-xs">
                    {organization.location}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {mutation.error ? (
        <p
          className="bg-danger/6 border border-danger/30 px-inset py-snug rounded-sm text-danger text-sm"
          role="alert"
        >
          {mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
