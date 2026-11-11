/** Section title with an optional intro line. `light` is for navy sections. */
export function SectionHeading({
  title,
  intro,
  light = false,
  className = "",
}: {
  title: string;
  intro?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex max-w-[700px] flex-col gap-3 ${className}`}>
      <h2
        className={`text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-extrabold tracking-[-0.3px] text-balance ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <p className={`text-lg leading-relaxed ${light ? "text-on-navy" : "text-body"}`}>{intro}</p>
      ) : null}
    </div>
  );
}
