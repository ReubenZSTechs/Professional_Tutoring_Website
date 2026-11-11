import type { NextConfig } from "next";

/**
 * The Python backend (backend/src) answers every /api/* request.
 *  - In development it runs on port 8000 (`npm run dev` starts it).
 *  - On Vercel it runs as the serverless function in api/index.py.
 *  - Set BACKEND_URL to send /api/* to a backend hosted elsewhere
 *    (see deploy/home_server).
 */
const backendUrl =
  process.env.BACKEND_URL ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");

const nextConfig: NextConfig = {
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
