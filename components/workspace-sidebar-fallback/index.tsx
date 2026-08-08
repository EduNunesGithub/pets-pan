import { twMerge } from "tailwind-merge";

import { Skeleton } from "@/components/skeleton";

const navGroups = [
  {
    itemWidths: ["w-16", "w-12", "w-24"],
    key: "operation",
    labelWidth: "w-16",
  },
  { itemWidths: ["w-16", "w-24"], key: "governance", labelWidth: "w-28" },
];

export function WorkspaceSidebarFallback() {
  return (
    <>
      <div className="border-b border-line flex flex-col gap-snug p-item">
        <Skeleton className="rounded-sm text-xs w-24" />
        <Skeleton className="h-control rounded-md w-full" />
      </div>

      <nav className="flex flex-1 flex-col gap-block px-snug py-item">
        {navGroups.map((group) => (
          <div className="flex flex-col gap-snug" key={group.key}>
            <div className="px-inset">
              <Skeleton
                className={twMerge("rounded-sm text-xs", group.labelWidth)}
              />
            </div>

            {group.itemWidths.map((width) => (
              <div
                className="border-l-2 border-transparent flex items-center px-inset py-snug"
                key={width}
              >
                <Skeleton className={twMerge("rounded-sm text-sm", width)} />
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-line border-t flex flex-col gap-snug p-item">
        <Skeleton className="rounded-sm text-xs w-16" />
        <Skeleton className="h-control rounded-md w-full" />
      </div>
    </>
  );
}
