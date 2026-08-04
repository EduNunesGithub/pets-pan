export function Skeleton({ className }: { className: string }) {
  return (
    <div aria-hidden className={`animate-pulse bg-line ${className}`}>
      &nbsp;
    </div>
  );
}
