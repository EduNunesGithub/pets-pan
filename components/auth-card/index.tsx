import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  kicker: string;
  title: string;
};

export function AuthCard({ children, kicker, title }: AuthCardProps) {
  return (
    <main className="flex flex-col gap-block items-center justify-center min-h-dvh prose-admin px-block py-frame">
      <p className="eyebrow text-muted">pet · monorepo</p>

      <section className="bg-card border border-line flex flex-col gap-section max-w-sm px-block py-block relative rounded-md shadow-card w-full">
        <span className="-translate-y-1/2 absolute bg-card border border-b-0 border-line eyebrow left-block px-inset py-pair rounded-t-sm text-pine top-0">
          {kicker}
        </span>

        <h1 className="text-ink">{title}</h1>

        {children}
      </section>
    </main>
  );
}
