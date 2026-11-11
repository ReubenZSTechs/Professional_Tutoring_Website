import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

export function Regions({ t }: SectionProps) {
  return (
    <section className="bg-surface py-20">
      <Container className="flex flex-col gap-7">
        <SectionHeading title={t.regions.title} intro={t.regions.sub} className="max-w-[720px]" />
        <ul className="flex flex-wrap gap-2.5">
          {t.regions.items.map((region) => (
            <li
              key={region}
              className="rounded-full border border-line bg-card px-4 py-2.5 text-[15px] font-semibold text-ink"
            >
              {region}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
