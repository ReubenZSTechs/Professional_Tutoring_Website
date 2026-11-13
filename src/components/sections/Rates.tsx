import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChatIcon, CheckIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatRupiah, rates } from "@/config/rates";
import { whatsappUrl } from "@/config/site";
import { sectionHref } from "@/content";

import type { SectionProps } from "./types";

/** Price table. Numbers come from src/config/rates.ts. */
export function Rates({ t, lang }: SectionProps) {
  return (
    <section id="rates" className="on-brand border-y border-brand-edge bg-brand py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-7">
          <SectionHeading title={t.rates.title} intro={t.rates.intro} light />
          <ul className="flex flex-col gap-3.5">
            {t.rates.notes.map((note) => (
              <li key={note} className="flex items-start gap-3 text-base leading-relaxed font-medium text-on-brand">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
                >
                  <CheckIcon size={14} />
                </span>
                {note}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3.5 pt-1">
            <ButtonLink href={sectionHref(lang, "contact")}>{t.rates.ctaConsult}</ButtonLink>
            <ButtonLink href={whatsappUrl(t.whatsappMessage)} variant="outline-light">
              <ChatIcon />
              {t.rates.ctaWhatsApp}
            </ButtonLink>
          </div>
        </div>

        <div data-reveal className="rounded-[20px] border border-transparent bg-card p-6 shadow-card sm:p-8 dark:border-line">
          <table className="w-full border-collapse text-left">
            <caption className="mb-2 text-left text-sm font-bold tracking-[1.2px] text-muted uppercase">
              {t.rates.tableTitle}
            </caption>
            <tbody>
              {rates.levels.map((level) => (
                <tr key={level.id} className="border-b border-line-soft last:border-b-0">
                  <th scope="row" className="py-4 pr-4 align-middle font-normal sm:py-5">
                    <span className="block text-lg font-extrabold text-ink sm:text-xl">
                      {t.rates.levels[level.id].name}
                    </span>
                    <span className="block text-sm font-medium text-muted">{t.rates.levels[level.id].note}</span>
                  </th>
                  <td className="py-4 text-right align-middle whitespace-nowrap sm:py-5">
                    <span className="block text-xl font-extrabold text-ink sm:text-2xl">
                      {formatRupiah(level.priceIdr, lang)}
                    </span>
                    <span className="block text-sm font-medium text-muted">{t.rates.perSession}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
