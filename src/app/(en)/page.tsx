import { headers } from "next/headers";

import { LandingPage } from "@/components/LandingPage";

/** English home page: / */
export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <LandingPage lang="en" nonce={nonce} />;
}
