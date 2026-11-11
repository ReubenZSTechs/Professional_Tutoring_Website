import { ChatWidget } from "@/components/chat/ChatWidget";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Faq } from "@/components/sections/Faq";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Rates } from "@/components/sections/Rates";
import { Regions } from "@/components/sections/Regions";
import { Subjects } from "@/components/sections/Subjects";
import { Why } from "@/components/sections/Why";
import { site } from "@/config/site";
import { getDictionary, type Lang } from "@/content";
import { buildJsonLd } from "@/lib/metadata";

/**
 * The whole landing page. To reorder, add or remove a section, edit the
 * list inside <main>. Each section is its own file in components/sections.
 */
export function LandingPage({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const props = { t, lang };

  return (
    <div id="top">
      <Header {...props} />
      <main id="main">
        <Hero {...props} />
        <Subjects {...props} />
        <Why {...props} />
        <Rates {...props} />
        <HowItWorks {...props} />
        <Experience {...props} />
        <About {...props} />
        <Regions {...props} />
        <Faq {...props} />
        <Contact {...props} />
      </main>
      <Footer {...props} />
      {site.features.chat ? <ChatWidget {...props} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(lang)).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
