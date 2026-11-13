import type { NextConfig } from "next";

/**
 * The Python backend (backend/) answers every /api/* request.
 *  - On Vercel, the project runs as two services (see vercel.json) and
 *    Vercel routes /api/* to the "backend" service before Next.js sees it,
 *    so no rewrite is needed here.
 *  - With `npm run dev` the backend runs on port 8000 and this file
 *    forwards /api/* to it.
 *  - Set BACKEND_URL to send /api/* to a backend hosted elsewhere
 *    (see deploy/home_server).
 *
 * Security headers for every response are set here; the per-request
 * Content-Security-Policy is set in src/proxy.ts.
 */
const backendUrl =
  process.env.BACKEND_URL ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

const securityHeaders = [
  // Only ever load the site over HTTPS, for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Never guess content types (stops some script-injection tricks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The site may not be shown inside another site's frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Send only the origin, not the full URL, to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site does not use any of these browser features.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Serve photos as-is from public/images. Vercel's image optimizer
    // (/_next/image) is not routed to a Next.js app running as a Vercel
    // service, so optimized URLs return 404 there. The photos are already
    // resized and compressed (see public/images), so nothing is lost.
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    if (!backendUrl) return [];
    return [{ source: "/api/:path*", destination: `${backendUrl.replace(/\/$/, "")}/api/:path*` }];
  },
};

export default nextConfig;
