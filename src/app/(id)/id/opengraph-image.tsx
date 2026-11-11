import { ogSize, renderOgImage } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Reuben Susanto Tutoring";

export default function Image() {
  return renderOgImage("id");
}
