import { Container } from "@/components/ui/Container";
import { ChatIcon, LinkIcon, MailIcon } from "@/components/ui/Icons";
import { site, whatsappUrl } from "@/config/site";
import { sectionHref } from "@/content";

import type { SectionProps } from "./types";

export function Footer({ t, lang }: SectionProps) {
  const explore = [
    { href: sectionHref(lang, "subjects"), label: t.nav.subjects },
    { href: sectionHref(lang, "rates"), label: t.nav.rates },
    { href: sectionHref(lang, "experience"), label: t.nav.experience },
    { href: sectionHref(lang, "faq"), label: t.nav.faq },
    { href: sectionHref(lang, "contact"), label: t.nav.contact },
  ];
  const social = [
    { href: site.links.linkedin, label: "LinkedIn" },
    { href: site.links.github, label: "GitHub" },
    { href: site.links.instagram, label: "Instagram" },
  ].filter((link) => link.href);

  const linkClass =
    "inline-flex items-center gap-2.5 py-1.5 text-[15px] font-medium text-on-brand-muted no-underline hover:text-on-brand";
  const titleClass = "mb-3 text-[13px] font-bold tracking-[1.2px] text-on-brand uppercase";

  return (
    <footer className="on-brand border-t border-brand-edge bg-brand text-on-brand-muted">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-[17px] font-extrabold tracking-wide text-on-accent">
              {site.initials}
            </span>
            <span className="text-lg font-extrabold text-on-brand">{site.brand}</span>
          </div>
          <p className="max-w-[360px] text-[15px] leading-relaxed">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.exploreTitle}>
          <h2 className={titleClass}>{t.footer.exploreTitle}</h2>
          <ul className="flex flex-col">
            {explore.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={titleClass}>{t.footer.contactTitle}</h2>
          <ul className="flex flex-col">
            <li>
              <a href={`mailto:${site.email}`} className={`${linkClass} break-all`}>
                <MailIcon size={18} className="shrink-0" />
                {site.email}
              </a>
            </li>
            <li>
              <a href={whatsappUrl(t.whatsappMessage)} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <ChatIcon size={18} className="shrink-0" />
                WhatsApp {site.whatsapp.display}
              </a>
            </li>
            {social.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <LinkIcon size={18} className="shrink-0" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <div className="border-t border-on-brand/10">
        {/* Extra space at the bottom on phones keeps this clear of the chat button. */}
        <Container className="pt-5 pb-24 text-sm sm:pb-5">
          <span className="font-semibold text-on-brand">
            © {new Date().getFullYear()} {site.brand}.
          </span>{" "}
          <span>{t.footer.rights}</span>
        </Container>
      </div>
    </footer>
  );
}
