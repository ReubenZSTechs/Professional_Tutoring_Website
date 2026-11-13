/** Section title with an optional intro line. `light` is for navy bands. */
export function SectionHeading({
  title,
  intro,
  light = false,
  className = "",
  as: Tag = "h2",
}: {
  title: string;
  intro?: string;
  light?: boolean;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div data-reveal className={`flex max-w-[700px] flex-col gap-3 ${className}`}>
      <Tag
        className={`text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-extrabold tracking-[-0.3px] text-balance ${
          light ? "text-on-brand" : "text-ink"
        }`}
      >
        {title}
      </Tag>
      {intro ? (
        <p className={`text-lg leading-relaxed ${light ? "text-on-brand-muted" : "text-body"}`}>{intro}</p>
      ) : null}
    </div>
  );
}
