"use client";

import { Menu } from "@base-ui/react/menu";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/client";

type OrganizationOption = {
  id: string;
  location: string | null;
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
    <div className="border-b border-line flex flex-col gap-snug p-item">
      <span className="eyebrow text-muted">Organização</span>

      <Menu.Root>
        <Menu.Trigger className="bg-card border border-line flex gap-inset h-control items-center px-inset rounded-md text-left transition-colors w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine hover:border-pine">
          <span className="flex-1 item min-w-0 text-ink truncate">
            {activeOrganization.name}
          </span>

          <ChevronsUpDown aria-hidden className="shrink-0 size-4 text-muted" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner align="start" sideOffset={4}>
            <Menu.Popup className="bg-card border border-line flex flex-col gap-pair min-w-56 origin-top p-pair prose-admin rounded-md shadow-card transition data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
              {organizations.map((organization) => {
                const isActive = organization.id === activeOrganization.id;

                return (
                  <Menu.Item
                    className="cursor-pointer flex gap-inset items-center justify-between px-inset py-snug rounded-sm transition-colors data-disabled:cursor-default data-highlighted:bg-pine data-highlighted:text-paper"
                    disabled={mutation.isPending || isActive}
                    key={organization.id}
                    onClick={() => mutation.mutate(organization.id)}
                  >
                    <span className="flex flex-col gap-pair min-w-0 text-left">
                      <span className="item truncate">{organization.name}</span>

                      {organization.location ? (
                        <span className="meta opacity-70 truncate">
                          {organization.location}
                        </span>
                      ) : null}
                    </span>

                    {isActive ? (
                      <Check
                        aria-hidden
                        className="shrink-0 size-4 text-pine"
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
