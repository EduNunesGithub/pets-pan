import { Skeleton } from "@/components/skeleton";

type AuthFormSkeletonProps = {
  fields: number;
};

export function AuthFormSkeleton({ fields }: AuthFormSkeletonProps) {
  return (
    <>
      <div className="flex flex-col gap-block">
        <div className="flex flex-col gap-item">
          {Array.from({ length: fields }, (_, index) => (
            <div className="flex flex-col gap-pair" key={index}>
              <Skeleton className="w-16 rounded-sm text-xs" />
              <Skeleton className="h-control w-full rounded-sm" />
            </div>
          ))}
        </div>

        <Skeleton className="h-control w-full rounded-md" />
      </div>

      <Skeleton className="w-40 rounded-sm text-sm" />
    </>
  );
}
