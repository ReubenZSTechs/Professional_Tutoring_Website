"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChatIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { site, whatsappUrl } from "@/config/site";
import { langPaths, sectionHref, type Lang } from "@/content";

import type { SectionProps } from "./types";

const LANGS: Lang[] = ["en", "id"];

function LanguageToggle({ lang, label, paths }: { lang: Lang; label: string; paths: Record<Lang, string> }) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-full border border-line p-0.5">
      {LANGS.map((code) => (
        <a
          key={code}
          href={paths[code]}
          hrefLang={code}
          aria-current={code === lang ? "true" : undefined}
          className={`flex min-h-10 min-w-10 items-center justify-center rounded-full px-2.5 text-sm font-bold no-underline transition-colors sm:min-w-11 sm:px-3 ${
            code === lang ? "bg-primary text-on-primary" : "text-ink hover:bg-surface"
          }`}
        >
          {code.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

/**
 * Site header. `paths` is where the EN/ID switch leads; on a subject page
 * it points at the same subject in the other language.
 */
export function Header({ t, lang, paths = langPaths }: SectionProps & { paths?: Record<Lang, string> }) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: sectionHref(lang, "subjects"), label: t.nav.subjects },
    { href: sectionHref(lang, "rates"), label: t.nav.rates },
    { href: sectionHref(lang, "experience"), label: t.nav.experience },
    { href: sectionHref(lang, "ask"), label: t.nav.ask },
    { href: sectionHref(lang, "contact"), label: t.nav.contact },
  ];

  return (
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 border-b-line">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        {t.nav.skipToContent}
      </a>
      <Container className="flex items-center justify-between gap-3 py-3">
        <a href={langPaths[lang]} className="flex min-w-0 items-center gap-3 text-ink no-underline">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-[17px] font-extrabold tracking-wide text-accent ring-1 ring-brand-edge">
            {site.initials}
          </span>
          <span className="flex flex-col leading-tight max-[359px]:sr-only">
            <span className="text-[17px] font-extrabold">{site.name}</span>
            <span className="text-[13px] font-semibold text-muted">Tutoring</span>
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 text-[15px] font-semibold text-ink no-underline transition-colors hover:text-link"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle lang={lang} label={t.nav.languageLabel} paths={paths} />
          <ThemeToggle labels={{ light: t.nav.themeLight, dark: t.nav.themeDark }} />
          {/* On phones the WhatsApp button moves into the menu. */}
          <span className="hidden sm:block">
            <ButtonLink href={whatsappUrl(t.whatsappMessage)} size="md">
              <ChatIcon size={18} />
              WhatsApp
            </ButtonLink>
          </span>
          <button
            type="button"
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-line text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>

      {open ? (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-page lg:hidden">
          <Container className="flex flex-col py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line-soft py-3.5 text-base font-semibold text-ink no-underline"
              >
                {link.label}
              </a>
            ))}
            <span className="mt-4 flex flex-col sm:hidden">
              <ButtonLink href={whatsappUrl(t.whatsappMessage)} size="md">
                <ChatIcon size={18} />
                {t.hero.ctaWhatsApp}
              </ButtonLink>
            </span>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
