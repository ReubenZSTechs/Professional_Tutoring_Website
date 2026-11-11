import { ContactForm } from "@/components/contact/ContactForm";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChatIcon, MailIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site, whatsappUrl } from "@/config/site";

import type { SectionProps } from "./types";

export function Contact({ t, lang }: SectionProps) {
  const hours = site.teachingHours[lang];
  const labelClass = "text-[13px] font-bold tracking-[1px] text-muted uppercase";

  return (
    <section id="contact" className="bg-surface py-20 sm:py-24">
      <Container className="grid items-start gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <SectionHeading title={t.contact.title} intro={t.contact.sub} />
          <dl className="mt-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <dt className={labelClass}>{t.contact.whatsappLabel}</dt>
              <dd className="text-[17px] font-bold">
                <a
                  href={whatsappUrl(t.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy hover:text-blue"
                >
                  {site.whatsapp.display}
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className={labelClass}>{t.contact.emailLabel}</dt>
              <dd className="text-[17px] font-bold break-all">
                <a href={`mailto:${site.email}`} className="text-navy hover:text-blue">
                  {site.email}
                </a>
              </dd>
            </div>
            {hours ? (
              <div className="flex flex-col gap-1">
                <dt className={labelClass}>{t.contact.hoursLabel}</dt>
                <dd className="text-[17px] font-bold">
                  {hours} {t.contact.hoursSuffix}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-[20px] border border-line bg-white p-6 shadow-card sm:p-8">
          {site.features.contactForm ? (
            <ContactForm t={t} lang={lang} />
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-extrabold">{t.contact.form.title}</h3>
              <ButtonLink href={whatsappUrl(t.whatsappMessage)}>
                <ChatIcon />
                {t.hero.ctaWhatsApp}
              </ButtonLink>
              <ButtonLink href={`mailto:${site.email}`} variant="outline">
                <MailIcon />
                {site.email}
              </ButtonLink>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
