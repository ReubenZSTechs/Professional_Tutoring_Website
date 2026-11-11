import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s)]+)/g;

/** Turn web addresses in an answer into clickable links. */
function linkify(text: string): ReactNode[] {
  return text.split(URL_RE).map((part, index) =>
    index % 2 === 1 ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function TypingDots({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 py-1" role="status" aria-label={label}>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 rounded-full bg-muted"
          style={{ animation: "dot 1.2s infinite", animationDelay: `${dot * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function ChatBubble({
  role,
  content,
  thinkingLabel,
}: {
  role: "user" | "assistant";
  content: string;
  thinkingLabel: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap ${
          isUser ? "rounded-br-md bg-primary text-on-primary" : "rounded-bl-md bg-surface text-ink"
        }`}
      >
        {content ? linkify(content.replace(/\*\*/g, "")) : <TypingDots label={thinkingLabel} />}
      </div>
    </div>
  );
}
