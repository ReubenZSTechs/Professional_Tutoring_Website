import { ChatPanel } from "@/components/chat/ChatPanel";
import { Container } from "@/components/ui/Container";
import { SparkIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

import type { SectionProps } from "./types";

/** "Ask me anything": the AI assistant, inline, where the FAQ used to be. */
export function AskMe({ t }: SectionProps) {
  return (
    <section id="ask" className="scroll-mt-24 bg-surface py-20 sm:py-24">
      <Container className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold tracking-[1px] text-accent-ink uppercase">
            <SparkIcon size={14} />
            {t.ask.eyebrow}
          </span>
          <SectionHeading title={t.ask.title} intro={t.ask.intro} />
        </div>
        <div
          data-reveal
          className="flex h-[min(640px,80vh)] min-h-[480px] flex-col overflow-hidden rounded-[24px] border border-line bg-card shadow-card"
        >
          <div className="on-brand flex items-center gap-3 border-b border-brand-edge bg-brand px-5 py-3.5 text-on-brand">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
              <SparkIcon size={18} />
            </span>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[15px] font-extrabold">{t.chat.title}</span>
              <span className="text-xs font-medium text-on-brand-muted">{t.chat.subtitle}</span>
            </div>
          </div>
          <ChatPanel variant="inline" suggestions={t.ask.suggestions} inputId="ask-input" />
        </div>
        <p className="text-sm text-muted">{t.ask.note}</p>
      </Container>
    </section>
  );
}
