import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { RevealObserver } from "@/components/ui/RevealObserver";
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
 * Runs before the page is painted:
 *  - applies the visitor's saved theme, or their system setting, so the
 *    page never flashes the wrong colours;
 *  - marks the page as having JavaScript, which switches on the scroll
 *    animations (without JavaScript everything is simply visible).
 */
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.setAttribute("data-theme",t)}catch(e){}})()`;

/** The <html> and <body> wrapper shared by the English and Indonesian pages. */
export async function RootShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  // The per-request nonce from src/proxy.ts lets our inline scripts run under the CSP.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // The boot script changes <html> attributes before React loads, hence the warning suppression.
    <html lang={lang} className={jakarta.variable} suppressHydrationWarning>
      {/* App Router root layouts use a plain <head>; next/head is only for the old pages/ router. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
