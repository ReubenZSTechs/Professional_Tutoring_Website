import type { NextConfig } from "next";

/**
 * The Python backend (backend/src) answers every /api/* request.
 *  - In development it runs on port 8000 (`npm run dev` starts it).
 *  - On Vercel it runs as the serverless function in api/index.py.
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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: backendUrl ? `${backendUrl.replace(/\/$/, "")}/api/:path*` : "/api/",
      },
    ];
  },
};

export default nextConfig;
