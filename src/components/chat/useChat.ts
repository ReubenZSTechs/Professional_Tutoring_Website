"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { Lang } from "@/content";
import {
  createChatSession,
  RateLimitError,
  SessionError,
  streamChat,
  type ChatIntent,
  type ChatMessage,
  type ChatSession,
} from "@/lib/api";

const STORAGE_KEY = "rst-chat-v2";

interface Stored {
  messages: ChatMessage[];
  /** How many of the latest messages the server signed, and its signature. */
  signedCount: number;
  signature: string;
  session: ChatSession | null;
}

const EMPTY: Stored = { messages: [], signedCount: 0, signature: "", session: null };

const subscribeNothing = () => () => {};

function load(): Stored {
  if (typeof window === "undefined") return EMPTY;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    return saved && Array.isArray(saved.messages) ? { ...EMPTY, ...saved } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export type ChatStatus = "idle" | "verifying" | "streaming";

export interface ChatLabels {
  error: string;
  sessionError: string;
  limitError: string;
}

/**
 * Chat state shared by the inline panel and the pop-up:
 * the messages, what the assistant is doing, and the intent of the latest
 * question (used to show the booking prompt).
 *
 * Security protocol with the API:
 *  - Before the first message a Turnstile check (`getToken`) buys a short
 *    session token.
 *  - The server signs the transcript it has seen; we send that exact
 *    window back with its signature so the history cannot be forged.
 */
export function useChat(lang: Lang, labels: ChatLabels, getToken: () => Promise<string>) {
  const [state, setState] = useState<Stored>(load);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [intent, setIntent] = useState<ChatIntent | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The saved conversation exists only in the browser. Until hydration is
  // done we show the empty state, so the server and client markup match.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  // Latest state for event handlers, updated after every render.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode). The chat still works.
    }
  }, [state]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Replace the text of the answer currently being written. */
  const setAnswer = useCallback((update: (current: string) => string) => {
    setState((s) => {
      const last = s.messages[s.messages.length - 1];
      if (!last || last.role !== "assistant") return s;
      return { ...s, messages: [...s.messages.slice(0, -1), { role: "assistant", content: update(last.content) }] };
    });
  }, []);

  const ensureSession = useCallback(
    async (force = false): Promise<ChatSession> => {
      const current = stateRef.current.session;
      const fresh = current && current.expiresAt - 30 > Date.now() / 1000;
      if (fresh && !force) return current;
      setStatus("verifying");
      const session = await createChatSession(await getToken());
      setState((s) => ({ ...s, session }));
      return session;
    },
    [getToken],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || status !== "idle") return;

      const before = stateRef.current;
      const history = before.messages.slice(-before.signedCount);
      const signature = before.signature;
      setState((s) => ({
        ...s,
        messages: [...s.messages, { role: "user", content: message }, { role: "assistant", content: "" }],
      }));
      setIntent(null);

      const controller = new AbortController();
      abortRef.current = controller;
      const run = async (session: ChatSession) => {
        setStatus("streaming");
        await streamChat(
          { message, history, historySignature: signature, sessionToken: session.token, language: lang },
          (event) => {
            if (event.type === "token") setAnswer((current) => current + event.text);
            else if (event.type === "replace") setAnswer(() => event.text);
            else if (event.type === "meta") setIntent(event.intent);
            else if (event.type === "done") {
              setState((s) => ({ ...s, signedCount: event.history_len, signature: event.history_signature }));
            } else if (event.type === "error") setAnswer((current) => current || event.message);
          },
          controller.signal,
        );
      };

      try {
        try {
          await run(await ensureSession());
        } catch (error) {
          if (!(error instanceof SessionError)) throw error;
          // The session expired or was rejected: verify again once, then retry.
          await run(await ensureSession(true));
        }
        setAnswer((current) => current || labels.error);
      } catch (error) {
        if (controller.signal.aborted) return;
        const text =
          error instanceof RateLimitError
            ? labels.limitError
            : error instanceof SessionError
              ? labels.sessionError
              : labels.error;
        setAnswer((current) => current || text);
      } finally {
        setStatus("idle");
      }
    },
    [status, lang, labels, ensureSession, setAnswer],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...EMPTY, session: s.session }));
    setIntent(null);
    setStatus("idle");
  }, []);

  return { messages: hydrated ? state.messages : [], status, intent, send, clear };
}
