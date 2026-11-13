"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal animations, in both directions.
 *
 * Any element with a `data-reveal` attribute starts hidden and fades in
 * when it scrolls into view. When it scrolls out again it is hidden, and
 * remembers which edge it left through, so it slides up when it comes
 * back from below and slides down when it comes back from above.
 *
 * The CSS is in globals.css. Visitors who prefer reduced motion, and
 * browsers without JavaScript, see everything immediately.
 */
export function RevealObserver() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => (el.dataset.revealed = ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.dataset.revealed = "";
          } else {
            delete el.dataset.revealed;
            // Left through the top edge? Then it will re-enter from above.
            el.dataset.revealFrom = entry.boundingClientRect.top < 0 ? "top" : "bottom";
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const watch = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => observer.observe(el));
    };
    watch(document);

    // Content that appears later (chat messages, menus) gets the same treatment.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches("[data-reveal]")) observer.observe(node);
            watch(node);
          }
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
