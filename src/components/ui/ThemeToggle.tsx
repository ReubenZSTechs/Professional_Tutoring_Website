"use client";

import { useEffect, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

import { MoonIcon, SunIcon } from "./Icons";

function currentTheme(): Theme | null {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "dark" || value === "light" ? value : null;
}

/** Re-render whenever the page's data-theme attribute changes. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function savedChoice(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Sun/moon button that switches between light and dark mode. */
export function ThemeToggle({ labels }: { labels: { light: string; dark: string } }) {
  // Unknown during server rendering; the icon appears once the page loads.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);

  // Until the visitor picks a theme, follow the system setting live.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (!savedChoice()) apply(media.matches ? "dark" : "light");
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const isDark = theme === "dark";
  const label = isDark ? labels.light : labels.dark;

  function toggle() {
    const next: Theme = isDark ? "light" : "dark";
    apply(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode): the choice lasts for this page only.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line text-ink transition-colors hover:bg-surface"
    >
      {theme === null ? null : isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
