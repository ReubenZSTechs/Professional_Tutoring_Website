import { Container } from "@/components/ui/Container";
import { CheckIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

export function Why({ t }: SectionProps) {
  return (
    <section className="bg-surface py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading title={t.why.title} intro={t.why.intro} />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.items.map((item) => (
            <li key={item.title} className="reveal flex flex-col gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-full bg-accent text-on-accent"
              >
                <CheckIcon size={22} />
              </span>
              <h3 className="text-[19px] leading-snug font-extrabold text-ink">{item.title}</h3>
              <p className="text-[15px] leading-relaxed text-body">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
