/**
 * Browser-side helpers for talking to the Python backend (/api/*).
 * The request and response shapes match backend/src/agent/routes.
 */
import type { Lang } from "@/content";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatIntent = "info" | "booking" | "smalltalk" | "off_topic";

export type ChatEvent =
  | { type: "meta"; language: Lang; intent: ChatIntent; query: string }
  | { type: "token"; text: string }
  | { type: "replace"; text: string }
  | { type: "done"; sources: string[]; history_signature: string; history_len: number }
  | { type: "error"; message: string };

export interface ChatSession {
  token: string;
  expiresAt: number; // unix seconds
  historyWindow: number;
}

export interface ChatRequest {
  message: string;
  /** The last messages the server signed, exactly as it signed them. */
  history: ChatMessage[];
  historySignature: string;
  sessionToken: string;
  language: Lang;
}

/** Thrown when the chat session is missing or expired: get a new one and retry. */
export class SessionError extends Error {}
/** Thrown when the visitor has hit a rate limit. */
export class RateLimitError extends Error {}

/** Exchange a solved Turnstile challenge for a chat session. */
export async function createChatSession(turnstileToken: string): Promise<ChatSession> {
  const response = await fetch("/api/chat/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnstile_token: turnstileToken }),
  });
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new SessionError(`Session request failed (${response.status})`);
  const data = await response.json();
  return { token: data.session_token, expiresAt: data.expires_at, historyWindow: data.history_window };
}

/** Parse one "event: x\ndata: {...}" block from the stream. */
function parseEvent(block: string): ChatEvent | null {
  let event = "";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!event || !data) return null;
  try {
    return { type: event, ...JSON.parse(data) } as ChatEvent;
  } catch {
    return null;
  }
}

/**
 * Ask the chat assistant a question. `onEvent` is called for every
 * event as the answer streams in. Throws if the request itself fails.
 */
export async function streamChat(
  request: ChatRequest,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      message: request.message,
      history: request.history,
      history_signature: request.historySignature,
      session_token: request.sessionToken,
      language: request.language,
    }),
    signal,
  });
  if (response.status === 401) throw new SessionError("session_required");
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const event = parseEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      if (event) onEvent(event);
      boundary = buffer.indexOf("\n\n");
    }
  }
}

export interface EnquiryPayload {
  name: string;
  role: "parent" | "student";
  subject: string;
  level: string;
  phone: string;
  email: string;
  message: string;
  language: Lang;
  /** Solved Turnstile challenge. */
  turnstile_token: string;
  /** Honeypot. Always empty for real visitors. */
  website: string;
}

/** Send the contact form. Throws if the enquiry could not be delivered. */
export async function sendEnquiry(payload: EnquiryPayload): Promise<void> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) {
    throw new Error(`Enquiry failed (${response.status})`);
  }
}
