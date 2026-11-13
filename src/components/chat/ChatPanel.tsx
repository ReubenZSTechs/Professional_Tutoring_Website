"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ChatIcon, SendIcon, TrashIcon } from "@/components/ui/Icons";
import { whatsappUrl } from "@/config/site";

import { ChatBubble } from "./ChatMessage";
import { useChatContext } from "./ChatProvider";

/**
 * The conversation itself: greeting, suggestions, messages and the
 * input. Used both inline on the home page and inside the pop-up.
 */
export function ChatPanel({
  variant,
  suggestions,
  inputId,
}: {
  variant: "inline" | "popup";
  suggestions: string[];
  inputId: string;
}) {
  const { t, messages, status, intent, send, clear } = useChatContext();
  const c = t.chat;
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const whatsapp = whatsappUrl(t.whatsappMessage);
  const busy = status !== "idle";

  // Keep the newest message in view while the answer streams in.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, intent, status]);

  function ask(text: string) {
    setDraft("");
    void send(text);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  const inline = variant === "inline";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        aria-live="polite"
        className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 ${inline ? "sm:px-6 sm:py-6" : ""}`}
      >
        <ChatBubble role="assistant" content={c.greeting} thinkingLabel={c.thinking} />

        {messages.length === 0 ? (
          <div className={`flex flex-wrap gap-2 pt-1 ${inline ? "max-w-[720px]" : "flex-col items-start"}`}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => ask(suggestion)}
                className="cursor-pointer rounded-full border border-line bg-card px-3.5 py-2 text-left text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            role={message.role}
            content={message.content}
            thinkingLabel={status === "verifying" && index === messages.length - 1 ? c.verifying : c.thinking}
          />
        ))}

        {intent === "booking" && !busy ? (
          <div className="flex flex-col items-start gap-2.5 rounded-2xl border border-line bg-accent-soft p-3.5">
            <p className="text-sm font-bold text-accent-ink">{c.bookingPrompt}</p>
            <ButtonLink href={whatsapp} size="md">
              <ChatIcon size={18} />
              {c.whatsapp}
            </ButtonLink>
          </div>
        ) : null}
      </div>

      <div className={`border-t border-line px-4 pt-3 pb-3 ${inline ? "sm:px-6 sm:pb-5" : ""}`}>
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {c.placeholder}
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={c.placeholder}
            maxLength={800}
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-field bg-card px-3.5 text-base text-ink placeholder:text-placeholder"
          />
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              aria-label={c.clear}
              title={c.clear}
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <TrashIcon size={18} />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label={c.send}
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon />
          </button>
        </form>
        <p className="mt-2.5 text-xs leading-snug text-muted">
          {c.disclaimer}{" "}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline">
            WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}
