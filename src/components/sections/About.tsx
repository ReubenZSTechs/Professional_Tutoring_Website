import Image from "next/image";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/config/site";

import type { SectionProps } from "./types";

/** Portrait if `site.photo` is set, otherwise a card with the initials. */
function Portrait({ alt }: { alt: string }) {
  const photo = site.photos.about;
  if (photo) {
    return (
      <div data-reveal className="relative w-full max-w-[420px]">
        {/* Amber frame offset behind the photo. */}
        <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-[20px] bg-accent" />
        <Image
          src={photo.src}
          alt={alt}
          width={photo.width}
          height={photo.height}
          sizes="(min-width: 1024px) 420px, 90vw"
          priority={false}
          className="relative aspect-[4/5] w-full rounded-[20px] object-cover shadow-card"
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className="relative flex aspect-[4/5] w-full max-w-[420px] flex-col justify-end overflow-hidden rounded-[20px] bg-brand p-8 shadow-card"
    >
      <span
        aria-hidden="true"
        className="absolute -top-6 -right-4 text-[220px] leading-none font-extrabold text-on-brand/[0.06]"
      >
        {site.initials}
      </span>
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent text-2xl font-extrabold text-on-accent">
        {site.initials}
      </span>
      <span className="mt-5 text-2xl font-extrabold text-on-brand">{site.fullName}</span>
      <span className="mt-1 text-[15px] font-semibold text-on-brand-muted">{site.brand}</span>
    </div>
  );
}

export function About({ t }: SectionProps) {
  return (
    <section id="about" className="py-20 sm:py-24">
      <Container className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Portrait alt={t.about.photoAlt} />
        <div className="flex flex-col gap-5">
          <SectionHeading title={t.about.title} />
          {t.about.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-[1.7] text-body">
              {paragraph}
            </p>
          ))}
          <ul className="mt-2 flex flex-wrap gap-2.5">
            {t.about.tags.map((tag) => (
              <li key={tag} className="rounded-[10px] bg-chip px-3.5 py-2 text-sm font-bold text-chip-ink">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
