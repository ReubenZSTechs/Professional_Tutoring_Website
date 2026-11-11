import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "accent" | "navy" | "outline" | "outline-light";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-xl font-bold no-underline transition-[background-color,color,border-color,transform] duration-150 active:translate-y-px";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-navy hover:bg-[#f5b752]",
  navy: "bg-navy text-white hover:bg-navy-soft",
  outline: "border-2 border-navy text-navy hover:bg-navy hover:text-white",
  "outline-light": "border-2 border-white text-white hover:bg-white hover:text-navy",
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
