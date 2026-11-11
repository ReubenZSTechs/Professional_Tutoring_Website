import type { Dictionary, Lang } from "@/content";

/** Every section receives the page wording (`t`) and the current language. */
export interface SectionProps {
  t: Dictionary;
  lang: Lang;
}
