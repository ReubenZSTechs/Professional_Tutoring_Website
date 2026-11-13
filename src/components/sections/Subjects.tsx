import type { CSSProperties } from "react";

import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { subjectPath } from "@/content";
import { getSubjects } from "@/content/subjects";

import type { SectionProps } from "./types";

/** Subject cards. Each opens its own page; content is in src/content/subjects.ts. */
export function Subjects({ t, lang }: SectionProps) {
  return (
    <section id="subjects" className="py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading title={t.subjects.title} intro={t.subjects.intro} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getSubjects(lang).map((subject, index) => (
            <a
              key={subject.slug}
              href={subjectPath(lang, subject.slug)}
              data-reveal
              style={{ "--reveal-i": index } as CSSProperties}
              className="group flex flex-col gap-3.5 rounded-[18px] border border-line bg-card p-7 text-ink no-underline transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-field hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-14 min-w-14 items-center justify-center rounded-[14px] bg-brand px-2.5 font-mono text-[17px] font-extrabold text-accent ring-1 ring-brand-edge"
                >
                  {subject.symbol}
                </span>
                {subject.badge ? <Badge>{subject.badge}</Badge> : null}
              </div>
              <h3 className="mt-1 text-[21px] font-extrabold">{subject.name}</h3>
              <p className="text-[15px] font-bold text-link">{subject.levels}</p>
              <p className="text-[15px] leading-relaxed text-body">{subject.summary}</p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                <span className="text-[13px] font-semibold text-muted">{subject.codes}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ink">
                  {t.subjects.seeTopics}
                  <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
