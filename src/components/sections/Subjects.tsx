import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

export function Subjects({ t }: SectionProps) {
  return (
    <section id="subjects" className="py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading title={t.subjects.title} intro={t.subjects.intro} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.subjects.items.map((subject) => (
            <article
              key={subject.name}
              className="reveal flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-7 transition-shadow hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-14 min-w-14 items-center justify-center rounded-[14px] bg-navy px-2.5 font-mono text-[17px] font-extrabold text-accent"
                >
                  {subject.symbol}
                </span>
                {subject.badge ? <Badge>{subject.badge}</Badge> : null}
              </div>
              <h3 className="mt-1 text-[21px] font-extrabold">{subject.name}</h3>
              <p className="text-[15px] font-bold text-blue">{subject.levels}</p>
              <p className="text-[15px] leading-relaxed text-body">{subject.desc}</p>
              <p className="mt-auto border-t border-line-soft pt-3 text-[13px] font-semibold text-muted">
                {subject.codes}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
