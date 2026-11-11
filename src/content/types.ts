import type { RateLevelId } from "@/config/rates";

export type Lang = "en" | "id";

interface TitleText {
  title: string;
  text: string;
}

/**
 * The shape of all page wording. en.ts and id.ts must both follow it,
 * so TypeScript tells you if a translation is missing.
 *
 * These placeholders are filled in automatically from src/config:
 *   {years}  {sessionMinutes}  {sessionsPerWeek}  {consultMinutes}
 */
export interface Dictionary {
  meta: { title: string; description: string };
  /** Message already typed in when a visitor opens WhatsApp from the site. */
  whatsappMessage: string;
  nav: {
    subjects: string;
    rates: string;
    experience: string;
    faq: string;
    contact: string;
    languageLabel: string;
    openMenu: string;
    closeMenu: string;
    skipToContent: string;
    /** Labels for the theme button: what clicking it will switch to. */
    themeLight: string;
    themeDark: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    ctaConsult: string;
    ctaWhatsApp: string;
    glanceTitle: string;
    tutorLabel: string;
    tutorMeta: string;
    glance: { k: string; v: string }[];
    trust: { value: string; label: string }[];
  };
  /** Section heading only; the subject cards come from content/subjects.ts. */
  subjects: { title: string; intro: string; seeTopics: string };
  /** Wording on the individual subject pages. */
  subjectPage: {
    breadcrumb: string;
    topicsTitle: string;
    ratesTitle: string;
    perSession: string;
    consultTitle: string;
    consultText: string;
    ctaConsult: string;
    ctaWhatsApp: string;
    otherSubjects: string;
    comingSoonTitle: string;
    comingSoonText: string;
    notifyMessage: string;
    metaTitle: string;
  };
  why: { title: string; intro: string; items: TitleText[] };
  rates: {
    title: string;
    intro: string;
    tableTitle: string;
    perSession: string;
    levels: Record<RateLevelId, { name: string; note: string }>;
    notes: string[];
    ctaConsult: string;
    ctaWhatsApp: string;
  };
  how: { title: string; intro: string; steps: TitleText[] };
  experience: {
    title: string;
    intro: string;
    items: { period: string; role: string; place: string; text: string }[];
    credentialsTitle: string;
    credentials: string[];
  };
  about: { title: string; photoAlt: string; paragraphs: string[]; tags: string[] };
  regions: { title: string; sub: string; items: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  contact: {
    title: string;
    sub: string;
    whatsappLabel: string;
    emailLabel: string;
    hoursLabel: string;
    hoursSuffix: string;
    form: {
      title: string;
      name: string;
      role: string;
      roles: { parent: string; student: string };
      subject: string;
      subjects: { value: string; label: string }[];
      level: string;
      levels: { value: string; label: string }[];
      phone: string;
      email: string;
      optional: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      note: string;
      required: string;
      invalidPhone: string;
      invalidEmail: string;
      sentTitle: string;
      sentText: string;
      sendAnother: string;
      errorTitle: string;
      errorText: string;
    };
  };
  footer: { tagline: string; contactTitle: string; exploreTitle: string; rights: string };
  chat: {
    open: string;
    close: string;
    title: string;
    subtitle: string;
    greeting: string;
    suggestions: string[];
    placeholder: string;
    send: string;
    thinking: string;
    error: string;
    whatsapp: string;
    bookingPrompt: string;
    disclaimer: string;
    clear: string;
  };
}
