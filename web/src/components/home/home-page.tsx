import { FaqSection } from "@/components/home/faq-section";
import { FinalCta } from "@/components/home/final-cta";
import { HeroSection } from "@/components/home/hero-section";
import { IntegrationsSection } from "@/components/home/integrations-section";
import { SafetySection } from "@/components/home/safety-section";
import { WorkflowSection } from "@/components/home/workflow-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <IntegrationsSection />
        <WorkflowSection />
        <SafetySection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
