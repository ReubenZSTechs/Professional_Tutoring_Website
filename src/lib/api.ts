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
  | { type: "done"; sources: string[] }
  | { type: "error"; message: string };

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  sessionId: string;
  language: Lang;
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
      session_id: request.sessionId,
      language: request.language,
    }),
    signal,
  });
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
  if (!response.ok) {
    throw new Error(`Enquiry failed (${response.status})`);
  }
}
