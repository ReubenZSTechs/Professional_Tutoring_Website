/**
 * Site-wide settings. Edit this file to change contact details, links
 * and which features are switched on. Page wording lives in
 * src/content/en.ts and src/content/id.ts; prices live in rates.ts.
 */
export const site = {
  /** Short name used in the logo and footer. */
  name: "Reuben Susanto",
  /** Full name used in the About section and search-engine data. */
  fullName: "Reuben Zachary Susanto",
  brand: "Reuben Susanto Tutoring",
  initials: "RS",

  /** Public address of the site. Set NEXT_PUBLIC_SITE_URL on Vercel. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  email: "reuben.zachary.rz@gmail.com",
  whatsapp: {
    /** Digits only, with country code, no "+". Used in wa.me links. */
    number: "628118495021",
    /** How the number is shown on the page. */
    display: "+62 811-849-5021",
  },
  links: {
    linkedin: "https://www.linkedin.com/in/reuben-zachary-susanto",
    github: "https://github.com/ReubenZSTechs",
    /** Leave empty to hide. Example: "https://instagram.com/yourname" */
    instagram: "",
  },

  /** Years of private teaching, shown as "10+" across the site. */
  yearsExperience: 10,

  /**
   * Teaching hours shown in the Contact section, in Jakarta time.
   * Leave both empty to hide the row. Example: "Mon to Sat, 15:00 to 21:00"
   */
  teachingHours: { en: "", id: "" },

  /**
   * Photos of Reuben. Put the files in public/images/ (JPEG, sizes in px).
   *  - hero:   tall 2:3 portrait shown on the home page
   *  - about:  4:5 upper-body crop for the About section
   *  - avatar: small square head-and-shoulders crop (chat header)
   * Set `hero` or `about` to null to show an initials card instead.
   */
  photos: {
    hero: { src: "/images/reuben-hero.jpg", width: 800, height: 1200 },
    about: { src: "/images/reuben-about.jpg", width: 640, height: 800 },
    avatar: "/images/reuben-avatar.jpg",
  },

  features: {
    /** The floating AI chat assistant. */
    chat: true,
    /** The enquiry form. When false, only WhatsApp and email are shown. */
    contactForm: true,
  },
} as const;

/** A wa.me link, optionally with a message already typed in. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${site.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
