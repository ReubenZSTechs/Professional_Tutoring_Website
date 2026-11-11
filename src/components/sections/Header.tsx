"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChatIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { site, whatsappUrl } from "@/config/site";
import { langPaths, type Lang } from "@/content";

import type { SectionProps } from "./types";

const LANGS: Lang[] = ["en", "id"];

function LanguageToggle({ lang, label }: { lang: Lang; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-full border border-[#cbd3df] p-0.5">
      {LANGS.map((code) => (
        <a
          key={code}
          href={langPaths[code]}
          hrefLang={code}
          aria-current={code === lang ? "true" : undefined}
          className={`flex min-h-10 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold no-underline transition-colors ${
            code === lang ? "bg-navy text-white" : "text-navy hover:bg-surface"
          }`}
        >
          {code.toUpperCase()}
        </a>
      ))}
    </div>
  );
}

export function Header({ t, lang }: SectionProps) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#subjects", label: t.nav.subjects },
    { href: "#rates", label: t.nav.rates },
    { href: "#experience", label: t.nav.experience },
    { href: "#faq", label: t.nav.faq },
    { href: "#contact", label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        {t.nav.skipToContent}
      </a>
      <Container className="flex items-center justify-between gap-4 py-3">
        <a href="#top" className="flex items-center gap-3 text-navy no-underline">
          <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-[17px] font-extrabold tracking-wide text-accent">
            {site.initials}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-extrabold">{site.name}</span>
            <span className="text-[13px] font-semibold text-muted">Tutoring</span>
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 text-[15px] font-semibold text-navy no-underline transition-colors hover:text-blue"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageToggle lang={lang} label={t.nav.languageLabel} />
          {/* On phones the WhatsApp button moves into the menu. */}
          <span className="hidden sm:block">
            <ButtonLink href={whatsappUrl(t.whatsappMessage)} size="md">
              <ChatIcon size={18} />
              WhatsApp
            </ButtonLink>
          </span>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl border border-line text-navy lg:hidden"
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
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line-soft py-3.5 text-base font-semibold text-navy no-underline"
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
