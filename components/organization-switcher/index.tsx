"use client";

import { Menu } from "@base-ui/react/menu";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/client";

type OrganizationOption = {
  id: string;
  location: null | string;
  name: string;
};

export function OrganizationSwitcher({
  activeOrganization,
  organizations,
}: {
  activeOrganization: OrganizationOption;
  organizations: OrganizationOption[];
}) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        throw new Error(
          error.message ?? "Não foi possível trocar de organização.",
        );
      }
    },
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <div className="flex flex-col gap-snug border-b border-line p-item">
      <span className="eyebrow text-muted">Organização</span>

      <Menu.Root>
        <Menu.Trigger className="flex h-control w-full items-center gap-inset rounded-md border border-line bg-card px-inset text-left transition-colors hover:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine">
          <span className="item min-w-0 flex-1 truncate text-ink">
            {activeOrganization.name}
          </span>

          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-muted" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="start" sideOffset={4}>
            <Menu.Popup className="prose-admin flex min-w-56 origin-top flex-col gap-pair rounded-md border border-line bg-card p-pair shadow-card transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              {organizations.map((organization) => {
                const isActive = organization.id === activeOrganization.id;

                return (
                  <Menu.Item
                    className="flex cursor-pointer items-center justify-between gap-inset rounded-sm px-inset py-snug transition-colors data-disabled:cursor-default data-highlighted:bg-pine data-highlighted:text-paper"
                    disabled={mutation.isPending || isActive}
                    key={organization.id}
                    onClick={() => mutation.mutate(organization.id)}
                  >
                    <span className="flex min-w-0 flex-col gap-pair text-left">
                      <span className="item truncate">{organization.name}</span>

                      {organization.location ? (
                        <span className="meta truncate opacity-70">
                          {organization.location}
                        </span>
                      ) : null}
                    </span>

                    {isActive ? (
                      <Check
                        aria-hidden
                        className="size-4 shrink-0 text-pine"
                      />
                    ) : null}
                  </Menu.Item>
                );
              })}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {mutation.error ? (
        <p className="text-danger" role="alert">
          {mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
