import type { ReactNode } from "react";

export function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-start font-display text-sm font-extrabold uppercase tracking-wide text-muted">
          {title}
        </h3>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="surface p-5 sm:p-6">
      <Section title={title} aside={aside}>
        {children}
      </Section>
    </div>
  );
}
