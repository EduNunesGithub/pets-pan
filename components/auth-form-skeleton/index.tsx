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
              <Skeleton className="rounded-sm text-xs w-16" />
              <Skeleton className="h-control rounded-sm w-full" />
            </div>
          ))}
        </div>

        <Skeleton className="h-control rounded-md w-full" />
      </div>

      <Skeleton className="rounded-sm text-sm w-40" />
    </>
  );
}
