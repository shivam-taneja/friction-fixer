import { ChartNoAxesCombined, Layers } from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";
import { PageContainer } from "@/components/layout/page-container";

const logoClass =
  "flex items-center gap-[7px] text-[21px] font-bold max-md:text-lg max-sm:text-base [&_svg]:size-6 max-sm:[&_svg]:size-[19px]";

export function IntegrationsSection() {
  return (
    <section
      className="border-b border-border py-8.75 pb-9.75 text-center max-sm:py-7.25"
      aria-label="Analytics and code ecosystem"
    >
      <PageContainer>
        <p className="mb-6.25 text-[11px] text-muted-foreground">
          Built around the tools you already use. Not another dashboard.
        </p>
        <div className="flex items-center justify-center gap-16.25 max-md:flex-wrap max-md:gap-7.5 max-sm:gap-6">
          <span className={logoClass}>
            <ChartNoAxesCombined />
            PostHog
          </span>
          <span className={logoClass}>
            <GithubIcon />
            GitHub
          </span>
          <span className={`${logoClass} font-medium text-muted-foreground`}>
            <span aria-hidden="true">Ⅲ</span> mixpanel
            <span className="text-[10px] font-medium tracking-normal text-muted-foreground">
              Coming soon
            </span>
          </span>
          <span className={`${logoClass} text-muted-foreground`}>
            <Layers />
            Amplitude
            <span className="text-[10px] font-medium tracking-normal text-muted-foreground">
              Coming soon
            </span>
          </span>
        </div>
      </PageContainer>
    </section>
  );
}
