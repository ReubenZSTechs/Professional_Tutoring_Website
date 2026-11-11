import type { MetadataRoute } from "next";

import { site } from "@/config/site";
import { langPaths } from "@/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(langPaths).map(([lang, path]) => [lang, new URL(path, site.url).toString()]),
  );
  return Object.values(langPaths).map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.9,
    alternates: { languages },
  }));
}
