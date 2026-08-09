import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  kicker: string;
  title: string;
};

export function AuthCard({ children, kicker, title }: AuthCardProps) {
  return (
    <main className="prose-admin flex min-h-dvh flex-col items-center justify-center gap-block px-block py-frame">
      <p className="eyebrow text-muted">pet · monorepo</p>

      <section className="relative flex w-full max-w-sm flex-col gap-section rounded-md border border-line bg-card px-block py-block shadow-card">
        <span className="eyebrow absolute top-0 left-block -translate-y-1/2 rounded-t-sm border border-b-0 border-line bg-card px-inset py-pair text-pine">
          {kicker}
        </span>

        <h1 className="text-ink">{title}</h1>

        {children}
      </section>
    </main>
  );
}
