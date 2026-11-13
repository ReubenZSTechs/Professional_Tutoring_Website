/**
 * Cloudflare Turnstile: an invisible bot check. The browser solves a
 * challenge and gets a token; the API confirms it with Cloudflare before
 * accepting a contact form or opening a chat session.
 *
 * In development Cloudflare's published test key is used, which always
 * passes, so no Cloudflare setup is needed to run the site locally.
 */

const TEST_SITE_KEY = "1x00000000000000000000AA";

export const TURNSTILE_SITE_KEY =
  process.env.NODE_ENV === "development"
    ? TEST_SITE_KEY
    : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? TEST_SITE_KEY);

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileReady?: () => void;
  }
}

let loading: Promise<TurnstileApi> | null = null;

/** Load the Turnstile script once and resolve with its API. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    window.__turnstileReady = () => resolve(window.turnstile!);
    // Created by a trusted script, so the CSP ('strict-dynamic') allows it.
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileReady&render=explicit";
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Get a fresh Turnstile token. Renders an invisible widget in `host`
 * (an empty div you keep in the page) and resolves when the challenge is
 * solved. Each call produces a new single-use token.
 */
export async function getTurnstileToken(host: HTMLElement, theme: "light" | "dark" | "auto" = "auto"): Promise<string> {
  const api = await loadTurnstile();
  return new Promise((resolve, reject) => {
    let widgetId = "";
    const finish = (fn: () => void) => {
      fn();
      if (widgetId) api.remove(widgetId);
    };
    widgetId = api.render(host, {
      sitekey: TURNSTILE_SITE_KEY,
      theme,
      appearance: "interaction-only",
      callback: (token: string) => finish(() => resolve(token)),
      "error-callback": () => finish(() => reject(new Error("Turnstile error"))),
      "expired-callback": () => finish(() => reject(new Error("Turnstile token expired"))),
      "timeout-callback": () => finish(() => reject(new Error("Turnstile timed out"))),
    });
  });
}
