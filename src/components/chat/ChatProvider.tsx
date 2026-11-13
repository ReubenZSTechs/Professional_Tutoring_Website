"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

import type { Dictionary, Lang } from "@/content";
import { getTurnstileToken } from "@/lib/turnstile";

import { useChat } from "./useChat";

type ChatContextValue = ReturnType<typeof useChat> & {
  t: Dictionary;
  lang: Lang;
  /** True on pages that have the inline chat section (the home page). */
  hasInline: boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * One conversation for the whole page, shared by the inline "Ask me"
 * section and the floating pop-up. Also hosts the invisible Turnstile
 * widget used to open a chat session.
 */
export function ChatProvider({
  t,
  lang,
  hasInline = false,
  children,
}: {
  t: Dictionary;
  lang: Lang;
  hasInline?: boolean;
  children: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const getToken = useCallback(async () => {
    if (!hostRef.current) throw new Error("Turnstile host missing");
    const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    return getTurnstileToken(hostRef.current, theme);
  }, []);
  const chat = useChat(
    lang,
    { error: t.chat.error, sessionError: t.chat.sessionError, limitError: t.chat.limitError },
    getToken,
  );

  return (
    <ChatContext.Provider value={{ ...chat, t, lang, hasInline }}>
      {children}
      {/* Turnstile renders here only while a challenge is being solved. */}
      <div ref={hostRef} className="fixed right-4 bottom-24 z-50 empty:hidden" />
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChatContext must be used inside <ChatProvider>");
  return value;
}
