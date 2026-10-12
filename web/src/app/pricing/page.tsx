import { PricingPage } from "@/components/pricing/pricing-page";
import { getServerUser } from "@/lib/auth/request-user";
import { pricingMetadata } from "@/lib/seo";

export const metadata = pricingMetadata;

export default async function Page() {
  const signedIn = Boolean(await getServerUser());
  return <PricingPage signedIn={signedIn} />;
}
