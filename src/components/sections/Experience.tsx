import { Container } from "@/components/ui/Container";
import { CheckIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

export function Experience({ t }: SectionProps) {
  return (
    <section id="experience" className="bg-surface py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <SectionHeading title={t.experience.title} intro={t.experience.intro} />
          <div className="rounded-[18px] border border-line bg-white p-7">
            <h3 className="mb-4 text-sm font-bold tracking-[1.2px] text-muted uppercase">
              {t.experience.credentialsTitle}
            </h3>
            <ul className="flex flex-col gap-3">
              {t.experience.credentials.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed font-semibold">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-chip text-blue"
                  >
                    <CheckIcon size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ol className="relative flex flex-col gap-5 before:absolute before:top-3 before:bottom-3 before:left-[7px] before:w-0.5 before:bg-line">
          {t.experience.items.map((item) => (
            <li key={`${item.role}-${item.place}`} className="reveal relative pl-9">
              <span
                aria-hidden="true"
                className="absolute top-7 left-0 size-4 rounded-full border-[3px] border-accent bg-white"
              />
              <div className="flex flex-col gap-2 rounded-[18px] border border-line bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <h3 className="text-lg font-extrabold">{item.role}</h3>
                  <span className="rounded-full bg-chip px-3 py-1 text-[13px] font-bold text-navy-soft">
                    {item.period}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-blue">{item.place}</p>
                <p className="text-[15px] leading-relaxed text-body">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
