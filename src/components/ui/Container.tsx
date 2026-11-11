import type { ReactNode } from "react";

/** Centres content and keeps a comfortable side margin on every screen. */
export function Container({
  children,
  className = "",
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className={`mx-auto w-full px-5 sm:px-6 ${narrow ? "max-w-[860px]" : "max-w-[1160px]"} ${className}`}>
      {children}
    </div>
  );
}
