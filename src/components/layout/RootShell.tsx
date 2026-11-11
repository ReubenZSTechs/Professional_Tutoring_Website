import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import type { Lang } from "@/content";

import "@/app/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

/** The <html> and <body> wrapper shared by the English and Indonesian pages. */
export function RootShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <html lang={lang} className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
