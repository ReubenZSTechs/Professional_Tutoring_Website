import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { About } from "@/components/sections/About";
import { AskMe } from "@/components/sections/AskMe";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
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
export function LandingPage({ lang, nonce }: { lang: Lang; nonce?: string }) {
  const t = getDictionary(lang);
  const props = { t, lang };
  const chat = site.features.chat;

  return (
    <ChatProvider t={t} lang={lang} hasInline={chat}>
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
          {chat ? <AskMe {...props} /> : null}
          <Contact {...props} />
        </main>
        <Footer {...props} />
        {chat ? <ChatWidget /> : null}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(lang)).replace(/</g, "\\u003c") }}
        />
      </div>
    </ChatProvider>
  );
}
