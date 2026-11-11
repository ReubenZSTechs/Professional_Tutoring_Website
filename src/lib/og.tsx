import { ImageResponse } from "next/og";

import { site } from "@/config/site";
import { getDictionary, type Lang } from "@/content";

export const ogSize = { width: 1200, height: 630 };

/** The preview image shown when the site link is shared (WhatsApp, LinkedIn…). */
export function renderOgImage(lang: Lang): ImageResponse {
  const t = getDictionary(lang);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#10233F",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "#F2A93B",
              color: "#10233F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            {site.initials}
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{site.brand}</div>
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.12, maxWidth: 980 }}>
          {t.hero.title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#F2A93B", fontWeight: 600 }}>
          {t.hero.glance[1].v} · {t.hero.eyebrow}
        </div>
      </div>
    ),
    ogSize,
  );
}
