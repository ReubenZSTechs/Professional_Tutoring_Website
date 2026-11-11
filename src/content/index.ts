import { formatRupiah, rates } from "@/config/rates";
import { site } from "@/config/site";
import { en } from "./en";
import { id } from "./id";
import type { Dictionary, Lang } from "./types";

export type { Dictionary, Lang } from "./types";

const dictionaries: Record<Lang, Dictionary> = { en, id };

/** Where each language lives. English is the home page. */
export const langPaths: Record<Lang, string> = { en: "/", id: "/id" };

/** Values for the {placeholders} used in en.ts and id.ts. */
function placeholders(lang: Lang): Record<string, string> {
  const values: Record<string, string> = {
    years: String(site.yearsExperience),
    sessionMinutes: String(rates.sessionMinutes),
    sessionsPerWeek: String(rates.sessionsPerWeek),
    consultMinutes: String(rates.consultationMinutes),
    fromPrice: formatRupiah(Math.min(...rates.levels.map((level) => level.priceIdr)), lang),
  };
  for (const level of rates.levels) {
    // {priceIgcse}, {priceAlevel}, {priceIb}
    const key = `price${level.id[0].toUpperCase()}${level.id.slice(1)}`;
    values[key] = formatRupiah(level.priceIdr, lang);
  }
  return values;
}

/** Replace {placeholders} in every string of the dictionary. */
function fill<T>(value: T, values: Record<string, string>): T {
  if (typeof value === "string") {
    return value.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => fill(item, values)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fill(item, values)]),
    ) as T;
  }
  return value;
}

/** The page wording for a language, with placeholders filled in. */
export function getDictionary(lang: Lang): Dictionary {
  return fill(dictionaries[lang], placeholders(lang));
}
