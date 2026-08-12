import { Skeleton } from "@/components/skeleton";

const groups = [
  /* order: espelha a ordem dos grupos no detalhe */
  { fields: 4, key: "features" },
  { fields: 2, key: "health" },
  { fields: 2, key: "about" },
  { fields: 2, key: "record" },
];

export function AnimalDetailSkeleton() {
  return (
    <div className="flex flex-col gap-block">
      <div className="flex flex-col gap-inset">
        <Skeleton className="w-14 rounded-sm text-xs" />
        <Skeleton className="h-8 w-48 rounded-md" />
      </div>

      {groups.map((group) => (
        <section
          className="flex flex-col gap-item rounded-md border border-line bg-card px-block py-item"
          key={group.key}
        >
          <Skeleton className="w-24 rounded-sm text-xs" />

          <div className="grid gap-item sm:grid-cols-2">
            {Array.from({ length: group.fields }, (_, index) => (
              <div className="flex flex-col gap-pair" key={index}>
                <Skeleton className="w-16 rounded-sm text-xs" />
                <Skeleton className="w-32 rounded-sm text-sm" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
