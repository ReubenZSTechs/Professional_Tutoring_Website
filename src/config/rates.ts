/**
 * Lesson prices. Edit the numbers here and they update everywhere on
 * the page. The names shown for each level are in src/content/en.ts and
 * id.ts under `rates.levels`.
 *
 * The chat assistant reads prices from knowledge/tutoring/rates.md, so
 * change that file too and run `npm run ingest` afterwards.
 */
export const rates = {
  /** Length of one lesson, in minutes. */
  sessionMinutes: 60,
  /** Recommended lessons per week. */
  sessionsPerWeek: 2,
  /** Length of the free first consultation, in minutes. */
  consultationMinutes: 40,
  /** Price per lesson in Indonesian Rupiah. */
  levels: [
    { id: "igcse", priceIdr: 225_000 },
    { id: "alevel", priceIdr: 275_000 },
    { id: "ib", priceIdr: 325_000 },
    { id: "university", priceIdr: 375_000 },
  ],
} as const;

export type RateLevelId = (typeof rates.levels)[number]["id"];

/** "Rp 250,000" in English, "Rp 250.000" in Indonesian. */
export function formatRupiah(amount: number, lang: "en" | "id"): string {
  const number = new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US").format(amount);
  return `Rp ${number}`;
}
