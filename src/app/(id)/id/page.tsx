import { headers } from "next/headers";

import { LandingPage } from "@/components/LandingPage";

/** Indonesian home page: /id */
export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <LandingPage lang="id" nonce={nonce} />;
}
