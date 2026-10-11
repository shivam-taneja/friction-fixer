import { FaqSection } from "@/components/home/faq-section";
import { FinalCta } from "@/components/home/final-cta";
import { HeroSection } from "@/components/home/hero-section";
import { IntegrationsSection } from "@/components/home/integrations-section";
import { SafetySection } from "@/components/home/safety-section";
import { WorkflowSection } from "@/components/home/workflow-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getServerUser } from "@/lib/auth/request-user";

export async function HomePage() {
  const signedIn = Boolean(await getServerUser());

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main>
        <HeroSection signedIn={signedIn} />
        <IntegrationsSection />
        <WorkflowSection />
        <SafetySection />
        <FaqSection />
        <FinalCta signedIn={signedIn} />
      </main>
      <SiteFooter />
    </>
  );
}
