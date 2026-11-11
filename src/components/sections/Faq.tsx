import { Container } from "@/components/ui/Container";
import { PlusIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

export function Faq({ t }: SectionProps) {
  return (
    <section id="faq" className="py-20 sm:py-24">
      <Container narrow className="flex flex-col gap-6">
        <SectionHeading title={t.faq.title} />
        <div className="flex flex-col border-t border-line">
          {t.faq.items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold">
                <span>{item.q}</span>
                <PlusIcon className="shrink-0 text-blue transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="pr-8 pb-6 text-base leading-[1.7] text-body">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
