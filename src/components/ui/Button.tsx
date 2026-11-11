import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "accent" | "primary" | "outline" | "outline-light";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-xl font-bold no-underline transition-[background-color,color,border-color,transform] duration-150 active:translate-y-px";

const variants: Record<Variant, string> = {
  /** Amber: the main call to action. */
  accent: "bg-accent text-on-accent hover:bg-accent-hover",
  /** Solid navy in light mode, solid light in dark mode. */
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  outline: "border-2 border-ink text-ink hover:bg-ink hover:text-page",
  /** For use on navy bands. */
  "outline-light": "border-2 border-on-brand text-on-brand hover:bg-on-brand hover:text-brand",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-[18px] text-[15px]",
  lg: "min-h-[54px] px-[26px] text-base",
};

export function buttonClass(variant: Variant = "accent", size: Size = "lg", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

/** A link that looks like a button. External links open in a new tab. */
export function ButtonLink({
  href,
  variant = "accent",
  size = "lg",
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={buttonClass(variant, size, className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}
