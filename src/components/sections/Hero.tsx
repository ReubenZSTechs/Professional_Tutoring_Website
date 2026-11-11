import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChatIcon } from "@/components/ui/Icons";
import { whatsappUrl } from "@/config/site";

import type { SectionProps } from "./types";

export function Hero({ t }: SectionProps) {
  return (
    <section className="bg-surface pt-14 pb-16 sm:pt-20 sm:pb-20">
      <Container className="flex flex-col gap-12 sm:gap-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div className="flex flex-col gap-6">
            <span className="self-start rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-[#2d3f57]">
              {t.hero.eyebrow}
            </span>
            <h1 className="text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.12] font-extrabold tracking-[-0.5px] text-balance">
              {t.hero.title}
            </h1>
            <p className="max-w-[580px] text-lg leading-relaxed text-body sm:text-[19px]">{t.hero.sub}</p>
            <div className="flex flex-wrap gap-3.5 pt-2">
              <ButtonLink href={whatsappUrl(t.whatsappMessage)}>
                <ChatIcon />
                {t.hero.ctaWhatsApp}
              </ButtonLink>
              <ButtonLink href="#contact" variant="outline">
                {t.hero.ctaConsult}
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-white p-6 shadow-card sm:p-8">
            <h2 className="mb-2 text-sm font-bold tracking-[1.2px] text-muted uppercase">{t.hero.glanceTitle}</h2>
            <dl className="flex flex-col">
              {t.hero.glance.map((row) => (
                <div
                  key={row.k}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line-soft py-4 last:border-b-0 last:pb-0"
                >
                  <dt className="text-[15px] font-medium text-muted">{row.k}</dt>
                  <dd className="text-right text-[15px] font-bold">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line lg:grid-cols-4">
          {t.hero.trust.map((item) => (
            <li key={item.label} className="flex flex-col gap-1 bg-white px-5 py-5 sm:px-7 sm:py-6">
              <span className="text-[22px] font-extrabold text-navy sm:text-[26px]">{item.value}</span>
              <span className="text-sm leading-snug font-medium text-muted">{item.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
