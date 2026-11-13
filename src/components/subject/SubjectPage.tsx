import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowLeftIcon, ArrowRightIcon, ChatIcon, CheckIcon } from "@/components/ui/Icons";
import { formatRupiah, rates } from "@/config/rates";
import { site, whatsappUrl } from "@/config/site";
import { getDictionary, sectionHref, subjectPath, subjectPaths, type Lang } from "@/content";
import { getSubjects, type Subject } from "@/content/subjects";

/** The page for one subject: topics by level, rates, and how to book. */
export function SubjectPage({ subject, lang }: { subject: Subject; lang: Lang }) {
  const t = getDictionary(lang);
  const p = t.subjectPage;
  const comingSoon = Boolean(subject.badge);
  const subjectRates = rates.levels.filter((level) => (subject.rateIds as string[]).includes(level.id));
  const others = getSubjects(lang).filter((other) => other.slug !== subject.slug);
  const message = comingSoon ? p.notifyMessage.replace("{subject}", subject.name) : t.whatsappMessage;

  return (
    <ChatProvider t={t} lang={lang}>
      <div id="top">
      <Header t={t} lang={lang} paths={subjectPaths(subject.slug)} />
      <main id="main">
        {/* Title */}
        <section className="border-b border-line bg-surface pt-10 pb-14 sm:pt-12 sm:pb-16">
          <Container className="flex flex-col gap-7">
            <a
              href={sectionHref(lang, "subjects")}
              className="inline-flex items-center gap-2 self-start text-[15px] font-semibold text-link no-underline hover:underline"
            >
              <ArrowLeftIcon size={18} />
              {p.breadcrumb}
            </a>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <span
                aria-hidden="true"
                className="flex h-[72px] min-w-[72px] shrink-0 items-center justify-center self-start rounded-[18px] bg-brand px-3 font-mono text-2xl font-extrabold text-accent ring-1 ring-brand-edge"
              >
                {subject.symbol}
              </span>
              <div className="flex max-w-[760px] flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[clamp(2rem,4vw,3rem)] leading-tight font-extrabold tracking-[-0.5px] text-ink">
                    {subject.name}
                  </h1>
                  {subject.badge ? <Badge>{subject.badge}</Badge> : null}
                </div>
                <p className="text-base font-bold text-link">{subject.levels}</p>
                <p className="text-lg leading-relaxed text-body">{subject.intro}</p>
              </div>
            </div>
          </Container>
        </section>

        {/* Topics and booking */}
        <section className="py-14 sm:py-20">
          <Container className="grid items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-extrabold text-ink sm:text-[28px]">{p.topicsTitle}</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {subject.groups.map((group) => (
                  <article
                    key={group.title}
                    data-reveal className="flex flex-col gap-4 rounded-[18px] border border-line bg-card p-6"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-extrabold text-ink">{group.title}</h3>
                      {group.codes ? <p className="text-[13px] font-semibold text-muted">{group.codes}</p> : null}
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {group.topics.map((topic) => (
                        <li key={topic} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-body">
                          <span
                            aria-hidden="true"
                            className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-chip text-link"
                          >
                            <CheckIcon size={10} />
                          </span>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
              {comingSoon ? (
                <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-6 shadow-card">
                  <h2 className="text-xl font-extrabold text-ink">{p.comingSoonTitle}</h2>
                  <p className="text-[15px] leading-relaxed text-body">{p.comingSoonText}</p>
                  <ButtonLink href={whatsappUrl(message)} size="md">
                    <ChatIcon size={18} />
                    WhatsApp
                  </ButtonLink>
                </div>
              ) : (
                <>
                  <div className="on-brand flex flex-col gap-1 rounded-[20px] border border-brand-edge bg-brand p-6 text-on-brand shadow-card">
                    <h2 className="mb-2 text-sm font-bold tracking-[1.2px] text-on-brand-muted uppercase">
                      {p.ratesTitle}
                    </h2>
                    <dl className="flex flex-col">
                      {subjectRates.map((level) => (
                        <div
                          key={level.id}
                          className="flex items-center justify-between gap-4 border-b border-on-brand/10 py-3 last:border-b-0"
                        >
                          <dt className="text-[15px] font-bold">{t.rates.levels[level.id].name}</dt>
                          <dd className="shrink-0 text-right whitespace-nowrap">
                            <span className="block text-xl font-extrabold">{formatRupiah(level.priceIdr, lang)}</span>
                            <span className="block text-xs font-medium text-on-brand-muted">{p.perSession}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-6 shadow-card">
                    <h2 className="text-lg font-extrabold text-ink">{p.consultTitle}</h2>
                    <p className="text-[15px] leading-relaxed text-body">{p.consultText}</p>
                    <ButtonLink href={sectionHref(lang, "contact")} size="md">
                      {p.ctaConsult}
                    </ButtonLink>
                    <ButtonLink href={whatsappUrl(message)} variant="outline" size="md">
                      <ChatIcon size={18} />
                      {p.ctaWhatsApp}
                    </ButtonLink>
                  </div>
                </>
              )}
              <p className="px-1 text-sm leading-relaxed text-muted">
                {site.fullName} · {t.hero.tutorMeta}
              </p>
            </aside>
          </Container>
        </section>

        {/* Other subjects */}
        <section className="border-t border-line bg-surface py-14 sm:py-16">
          <Container className="flex flex-col gap-6">
            <h2 className="text-2xl font-extrabold text-ink">{p.otherSubjects}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other) => (
                <li key={other.slug}>
                  <a
                    href={subjectPath(lang, other.slug)}
                    className="group flex h-full items-center gap-4 rounded-[16px] border border-line bg-card p-4 text-ink no-underline transition-[box-shadow,border-color] hover:border-field hover:shadow-card"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-xl bg-brand px-2 font-mono text-[15px] font-extrabold text-accent ring-1 ring-brand-edge"
                    >
                      {other.symbol}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-extrabold">{other.name}</span>
                      <span className="truncate text-[13px] font-semibold text-muted">{other.levels}</span>
                    </span>
                    <ArrowRightIcon size={18} className="shrink-0 text-link transition-transform group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <Footer t={t} lang={lang} />
      {site.features.chat ? <ChatWidget /> : null}
      </div>
    </ChatProvider>
  );
}
