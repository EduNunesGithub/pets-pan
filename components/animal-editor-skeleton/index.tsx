import { Skeleton } from "@/components/skeleton";

export function AnimalEditorSkeleton() {
  return (
    <div className="flex flex-col gap-block">
      <div className="flex flex-col gap-pair">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="w-full max-w-md rounded-sm text-base" />
        <Skeleton className="w-40 rounded-sm text-base" />
      </div>

      <section className="flex flex-col gap-item">
        <div className="flex flex-col gap-pair">
          <Skeleton className="w-14 rounded-sm text-xs" />
          <Skeleton className="w-56 rounded-sm text-sm" />
        </div>

        <ul className="grid grid-cols-2 gap-item sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li
              className="flex flex-col gap-pair rounded-md border border-line p-item"
              key={index}
            >
              <Skeleton className="aspect-4/3 w-full rounded-sm" />

              <div className="flex items-center justify-between gap-pair">
                <Skeleton className="w-16 rounded-sm text-sm" />
                <Skeleton className="w-14 rounded-sm text-sm" />
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-item rounded-md border border-dashed border-line p-item">
          <div className="flex flex-col gap-pair">
            <Skeleton className="w-12 rounded-sm text-xs" />
            <Skeleton className="h-32 w-full rounded-md" />
          </div>

          <div className="flex flex-col gap-pair">
            <Skeleton className="w-48 rounded-sm text-xs" />
            <Skeleton className="h-control w-full rounded-md" />
          </div>

          <Skeleton className="h-control w-full rounded-md" />
        </div>
      </section>

      <div className="flex flex-col gap-block">
        <div className="flex flex-col gap-item">
          {Array.from({ length: 7 }, (_, index) => (
            <div className="flex flex-col gap-pair" key={index}>
              <Skeleton className="w-24 rounded-sm text-xs" />
              <Skeleton className="h-control w-full rounded-md" />
            </div>
          ))}
        </div>

        <Skeleton className="h-control w-full rounded-md" />
      </div>
    </div>
  );
}
