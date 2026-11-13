import type { CSSProperties } from "react";

import Image from "next/image";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChatIcon } from "@/components/ui/Icons";
import { site, whatsappUrl } from "@/config/site";
import { sectionHref } from "@/content";

import type { SectionProps } from "./types";

/** Hero: the pitch on the left, Reuben's photo with a glass "At a glance" card on the right. */
export function Hero({ t, lang }: SectionProps) {
  const photo = site.photos.hero;
  return (
    <section className="relative overflow-hidden bg-surface pt-12 pb-16 sm:pt-16 sm:pb-20">
      {/* Soft background glow behind the photo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-[560px] w-[560px] translate-x-1/3 -translate-y-1/4 rounded-full bg-accent/15 blur-3xl"
      />
      <Container className="flex flex-col gap-12 sm:gap-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <span
              className="rise self-start rounded-full border border-line bg-card px-3.5 py-2 text-sm font-semibold text-body"
              style={{ "--rise-i": 0 } as CSSProperties}
            >
              {t.hero.eyebrow}
            </span>
            <h1
              className="rise text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.12] font-extrabold tracking-[-0.5px] text-balance text-ink"
              style={{ "--rise-i": 1 } as CSSProperties}
            >
              {t.hero.title}
            </h1>
            <p
              className="rise max-w-[580px] text-lg leading-relaxed text-body sm:text-[19px]"
              style={{ "--rise-i": 2 } as CSSProperties}
            >
              {t.hero.sub}
            </p>
            <div className="rise flex flex-wrap gap-3.5 pt-2" style={{ "--rise-i": 3 } as CSSProperties}>
              <ButtonLink href={whatsappUrl(t.whatsappMessage)}>
                <ChatIcon />
                {t.hero.ctaWhatsApp}
              </ButtonLink>
              <ButtonLink href={sectionHref(lang, "contact")} variant="outline">
                {t.hero.ctaConsult}
              </ButtonLink>
            </div>
          </div>

          {/* Photo with the glance card overlapping its lower-left corner. */}
          <div className="relative mx-auto w-full max-w-[460px] pb-40 sm:pb-36 lg:mx-0 lg:ml-auto lg:pb-28">
            <div className="photo-in relative ml-auto w-[88%] overflow-hidden rounded-[28px] shadow-card ring-1 ring-line sm:w-[80%] lg:w-[86%]">
              {photo ? (
                <Image
                  src={photo.src}
                  alt={t.about.photoAlt}
                  width={photo.width}
                  height={photo.height}
                  priority
                  sizes="(min-width: 1024px) 420px, (min-width: 640px) 60vw, 88vw"
                  className="aspect-[2/3] w-full object-cover object-top"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-brand text-6xl font-extrabold text-accent">
                  {site.initials}
                </div>
              )}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand/50 to-transparent"
              />
            </div>

            <div
              className="glass rise absolute bottom-0 left-0 w-[92%] rounded-[22px] p-5 shadow-card sm:w-[78%] sm:p-6 lg:w-[82%]"
              style={{ "--rise-i": 4 } as CSSProperties}
            >
              <a
                href={sectionHref(lang, "about")}
                className="mb-4 flex items-center gap-3.5 border-b border-glass-edge pb-4 text-glass-ink no-underline"
              >
                <Image
                  src={site.photos.avatar}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-full object-cover ring-2 ring-accent"
                />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-[11px] font-bold tracking-[1.2px] text-muted uppercase">{t.hero.tutorLabel}</span>
                  <span className="truncate text-base font-extrabold">{site.fullName}</span>
                  <span className="text-[13px] font-medium text-muted">{t.hero.tutorMeta}</span>
                </span>
              </a>
              <h2 className="mb-1 text-[11px] font-bold tracking-[1.2px] text-muted uppercase">{t.hero.glanceTitle}</h2>
              <dl className="flex flex-col">
                {t.hero.glance.map((row) => (
                  <div
                    key={row.k}
                    className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-glass-edge py-2.5 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-[13.5px] font-medium text-muted">{row.k}</dt>
                    <dd className="text-right text-[13.5px] font-bold text-glass-ink">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <ul
          data-reveal
          className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line lg:grid-cols-4"
        >
          {t.hero.trust.map((item) => (
            <li key={item.label} className="flex flex-col gap-1 bg-card px-5 py-5 sm:px-7 sm:py-6">
              <span className="text-[22px] font-extrabold text-ink sm:text-[26px]">{item.value}</span>
              <span className="text-sm leading-snug font-medium text-muted">{item.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
