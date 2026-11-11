import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-accent-soft px-2.5 py-1.5 text-xs font-bold text-accent-ink">
      {children}
    </span>
  );
}
