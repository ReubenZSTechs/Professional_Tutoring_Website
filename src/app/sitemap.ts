import type { MetadataRoute } from "next";

import { site } from "@/config/site";
import { langPaths, subjectPaths } from "@/content";
import { SUBJECT_SLUGS } from "@/content/subjects";

/** Home page and every subject page, each listed with its other-language version. */
export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (path: string) => new URL(path, site.url).toString();
  const entry = (paths: Record<string, string>, priority: number) => {
    const languages = Object.fromEntries(Object.entries(paths).map(([lang, path]) => [lang, absolute(path)]));
    return Object.values(paths).map((path) => ({
      url: absolute(path),
      changeFrequency: "monthly" as const,
      priority,
      alternates: { languages },
    }));
  };
  return [
    ...entry(langPaths, 1),
    ...SUBJECT_SLUGS.flatMap((slug) => entry(subjectPaths(slug), 0.8)),
  ];
}
