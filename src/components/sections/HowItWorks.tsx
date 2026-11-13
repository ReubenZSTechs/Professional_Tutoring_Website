import type { CSSProperties } from "react";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

export function HowItWorks({ t }: SectionProps) {
  return (
    <section id="how" className="py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading title={t.how.title} intro={t.how.intro} />
        <ol className="grid gap-6 md:grid-cols-3">
          {t.how.steps.map((step, index) => (
            <li key={step.title} data-reveal style={{ "--reveal-i": index } as CSSProperties} className="flex flex-col gap-3 rounded-[18px] border border-line bg-card p-7">
              <span className="text-[44px] leading-none font-extrabold text-link">{index + 1}</span>
              <h3 className="text-xl font-extrabold text-ink">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-body">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
