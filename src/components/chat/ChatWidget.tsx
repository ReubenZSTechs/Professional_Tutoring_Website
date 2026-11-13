"use client";

import { useEffect, useState } from "react";

import { CloseIcon, SparkIcon } from "@/components/ui/Icons";

import { ChatPanel } from "./ChatPanel";
import { useChatContext } from "./ChatProvider";

/**
 * Floating "Ask a question" button. On the home page it jumps to the
 * inline chat section (and hides while that section is on screen); on
 * other pages it opens a pop-up. Both share one conversation.
 */
export function ChatWidget() {
  const { t, hasInline } = useChatContext();
  const c = t.chat;
  const [open, setOpen] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(false);

  // Hide the button while the inline chat is in view.
  useEffect(() => {
    if (!hasInline) return;
    const target = document.getElementById("ask");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInlineVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasInline]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onButtonClick() {
    if (hasInline) {
      document.getElementById("ask")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => document.getElementById("ask-input")?.focus({ preventScroll: true }), 500);
    } else {
      setOpen(true);
    }
  }

  if (!open) {
    if (inlineVisible) return null;
    return (
      <button
        type="button"
        onClick={onButtonClick}
        className="fixed right-4 bottom-4 z-50 flex min-h-14 cursor-pointer items-center gap-2.5 rounded-full bg-brand pr-5 pl-4 text-[15px] font-bold text-on-brand shadow-float ring-2 ring-page transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6 dark:ring-line"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-on-accent">
          <SparkIcon size={18} />
        </span>
        {c.open}
      </button>
    );
  }

  return (
    <section
      aria-label={c.title}
      className="glass fixed inset-x-3 bottom-3 z-50 flex h-[min(640px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[22px] shadow-float sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
      style={{ animation: "chat-in 0.18s ease-out" }}
    >
      <header className="on-brand flex items-center gap-3 border-b border-brand-edge bg-brand px-4 py-3.5 text-on-brand">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <SparkIcon size={20} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <h2 className="truncate text-base font-extrabold">{c.title}</h2>
          <span className="text-[13px] font-medium text-on-brand-muted">{c.subtitle}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={c.close}
          title={c.close}
          className="flex size-10 cursor-pointer items-center justify-center rounded-full text-on-brand-muted hover:bg-on-brand/10 hover:text-on-brand"
        >
          <CloseIcon />
        </button>
      </header>
      <ChatPanel variant="popup" suggestions={c.suggestions} inputId="chat-popup-input" />
    </section>
  );
}
