import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import type { Lang } from "@/content";
import { THEME_STORAGE_KEY } from "@/lib/theme";

import "@/app/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

/**
 * Runs before the page is painted: applies the visitor's saved theme, or
 * their system setting, so the page never flashes the wrong colours.
 */
const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/** The <html> and <body> wrapper shared by the English and Indonesian pages. */
export function RootShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    // The theme script changes data-theme before React loads, hence the warning suppression.
    <html lang={lang} className={jakarta.variable} suppressHydrationWarning>
      {/* App Router root layouts use a plain <head>; next/head is only for the old pages/ router. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
