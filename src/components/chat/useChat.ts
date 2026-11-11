"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Lang } from "@/content";
import { streamChat, type ChatIntent, type ChatMessage } from "@/lib/api";

const STORAGE_KEY = "rst-chat";
const SESSION_KEY = "rst-chat-session";
/** How many earlier messages are sent to the server with each question. */
const HISTORY_LIMIT = 30;

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function sessionId(): string {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/**
 * Chat state for the widget: the message list, whether an answer is
 * streaming, and the intent of the latest question (used to show the
 * booking prompt). The conversation is kept for the browser tab only.
 */
export function useChat(lang: Lang, errorMessage: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [streaming, setStreaming] = useState(false);
  const [intent, setIntent] = useState<ChatIntent | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage can be unavailable (private mode). The chat still works.
    }
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;

      const history = messages.slice(-HISTORY_LIMIT);
      setMessages([...messages, { role: "user", content: message }, { role: "assistant", content: "" }]);
      setStreaming(true);
      setIntent(null);

      /** Replace the text of the answer currently being written. */
      const setAnswer = (update: (current: string) => string) =>
        setMessages((list) => {
          const last = list[list.length - 1];
          if (!last || last.role !== "assistant") return list;
          return [...list.slice(0, -1), { role: "assistant", content: update(last.content) }];
        });

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await streamChat(
          { message, history, sessionId: sessionId(), language: lang },
          (event) => {
            if (event.type === "token") setAnswer((current) => current + event.text);
            else if (event.type === "meta") setIntent(event.intent);
            else if (event.type === "error") setAnswer((current) => current || event.message);
          },
          controller.signal,
        );
        setAnswer((current) => current || errorMessage);
      } catch {
        if (!controller.signal.aborted) setAnswer((current) => current || errorMessage);
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, lang, errorMessage],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIntent(null);
    setStreaming(false);
  }, []);

  return { messages, streaming, intent, send, clear };
}
