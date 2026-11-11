import type { Metadata, Viewport } from "next";

import { formatRupiah, rates } from "@/config/rates";
import { site } from "@/config/site";
import { getDictionary, langPaths, type Lang } from "@/content";

export const viewport: Viewport = {
  themeColor: "#10233f",
  width: "device-width",
  initialScale: 1,
};

/** Page title, description and social-sharing tags for a language. */
export function buildMetadata(lang: Lang): Metadata {
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: langPaths[lang],
      languages: { en: langPaths.en, id: langPaths.id, "x-default": langPaths.en },
    },
    openGraph: {
      type: "website",
      siteName: site.brand,
      title: t.meta.title,
      description: t.meta.description,
      url: langPaths[lang],
      locale: lang === "id" ? "id_ID" : "en_US",
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description },
  };
}

/** Structured data that helps search engines understand the service. */
export function buildJsonLd(lang: Lang): Record<string, unknown> {
  const t = getDictionary(lang);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: site.brand,
    serviceType: "Private tutoring",
    description: t.meta.description,
    url: new URL(langPaths[lang], site.url).toString(),
    areaServed: "Indonesia",
    availableLanguage: ["English", "Indonesian"],
    provider: {
      "@type": "Person",
      name: site.fullName,
      email: site.email,
      telephone: `+${site.whatsapp.number}`,
      sameAs: Object.values(site.links).filter(Boolean),
    },
    offers: rates.levels.map((level) => ({
      "@type": "Offer",
      name: `${t.rates.levels[level.id].name} (${rates.sessionMinutes} min)`,
      price: level.priceIdr,
      priceCurrency: "IDR",
      description: `${formatRupiah(level.priceIdr, lang)} ${t.rates.perSession}`,
    })),
  };
}
