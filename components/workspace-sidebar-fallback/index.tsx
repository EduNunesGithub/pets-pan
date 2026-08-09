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
      <div className="flex flex-col gap-snug border-b border-line p-item">
        <Skeleton className="w-24 rounded-sm text-xs" />
        <Skeleton className="h-control w-full rounded-md" />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-block overflow-y-auto px-snug py-item">
        {navGroups.map((group) => (
          <div className="flex flex-col gap-snug" key={group.key}>
            <div className="px-inset">
              <Skeleton
                className={twMerge("rounded-sm text-xs", group.labelWidth)}
              />
            </div>

            {group.itemWidths.map((width) => (
              <div
                className="flex items-center border-l-2 border-transparent px-inset py-snug"
                key={width}
              >
                <Skeleton className={twMerge("rounded-sm text-sm", width)} />
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-snug border-t border-line p-item">
        <Skeleton className="w-16 rounded-sm text-xs" />
        <Skeleton className="h-control w-full rounded-md" />
      </div>
    </>
  );
}
