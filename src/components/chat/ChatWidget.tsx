"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ChatIcon, CloseIcon, SendIcon, SparkIcon, TrashIcon } from "@/components/ui/Icons";
import { whatsappUrl } from "@/config/site";
import type { Dictionary, Lang } from "@/content";

import { ChatBubble } from "./ChatMessage";
import { useChat } from "./useChat";

/** Floating "Ask a question" button that opens the AI chat panel. */
export function ChatWidget({ t, lang }: { t: Dictionary; lang: Lang }) {
  const c = t.chat;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { messages, streaming, intent, send, clear } = useChat(lang, c.error);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const whatsapp = whatsappUrl(t.whatsappMessage);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the newest message in view while the answer streams in.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open, intent]);

  function ask(text: string) {
    setDraft("");
    void send(text);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 flex min-h-14 cursor-pointer items-center gap-2.5 rounded-full bg-navy pr-5 pl-4 text-[15px] font-bold text-white shadow-[0_10px_30px_rgb(16_35_63/0.35)] ring-2 ring-white transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-navy">
          <SparkIcon size={18} />
        </span>
        {c.open}
      </button>
    );
  }

  return (
    <section
      aria-label={c.title}
      className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_24px_60px_rgb(16_35_63/0.28)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[392px]"
      style={{ animation: "chat-in 0.18s ease-out" }}
    >
      <header className="on-navy flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-navy">
          <SparkIcon size={20} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <h2 className="truncate text-base font-extrabold">{c.title}</h2>
          <span className="text-[13px] font-medium text-on-navy">{c.subtitle}</span>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            aria-label={c.clear}
            title={c.clear}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full text-on-navy hover:bg-white/10 hover:text-white"
          >
            <TrashIcon size={18} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={c.close}
          title={c.close}
          className="flex size-10 cursor-pointer items-center justify-center rounded-full text-on-navy hover:bg-white/10 hover:text-white"
        >
          <CloseIcon />
        </button>
      </header>

      <div ref={listRef} aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <ChatBubble role="assistant" content={c.greeting} thinkingLabel={c.thinking} />

        {messages.length === 0 ? (
          <div className="flex flex-col items-start gap-2 pt-1">
            {c.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="cursor-pointer rounded-full border border-line bg-white px-3.5 py-2 text-left text-sm font-semibold text-navy transition-colors hover:border-navy hover:bg-surface"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message, index) => (
          <ChatBubble key={index} role={message.role} content={message.content} thinkingLabel={c.thinking} />
        ))}

        {intent === "booking" && !streaming ? (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-accent-soft p-3.5">
            <p className="text-sm font-bold text-accent-ink">{c.bookingPrompt}</p>
            <ButtonLink href={whatsapp} size="md">
              <ChatIcon size={18} />
              {c.whatsapp}
            </ButtonLink>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line px-4 pt-3 pb-3">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            {c.placeholder}
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={c.placeholder}
            maxLength={1500}
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-field bg-white px-3.5 text-base text-navy placeholder:text-[#7a8798]"
          />
          <button
            type="submit"
            disabled={streaming || !draft.trim()}
            aria-label={c.send}
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-navy text-white transition-colors hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon />
          </button>
        </form>
        <p className="mt-2.5 text-xs leading-snug text-muted">
          {c.disclaimer}{" "}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-bold text-navy underline">
            WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}
