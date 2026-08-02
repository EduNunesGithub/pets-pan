import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  kicker: string;
  title: string;
};

export function AuthCard({ children, kicker, title }: AuthCardProps) {
  return (
    <main className="flex flex-col gap-block items-center justify-center min-h-dvh px-block py-frame">
      <p className="font-mono text-muted text-xs tracking-widest uppercase">
        pet · monorepo
      </p>

      <section className="bg-card border border-line flex flex-col gap-section max-w-sm px-block py-block relative rounded-md shadow-card w-full">
        <span className="-translate-y-1/2 absolute bg-card border border-b-0 border-line font-mono left-block px-inset py-pair rounded-t-sm text-pine text-xs top-0 tracking-widest uppercase">
          {kicker}
        </span>

        <h1 className="font-semibold text-2xl text-ink tracking-tight">
          {title}
        </h1>

        {children}
      </section>
    </main>
  );
}
