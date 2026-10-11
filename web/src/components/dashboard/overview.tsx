"use client";

import { useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { ChangeList } from "@/components/dashboard/change-list";
import { ConversionChart } from "@/components/dashboard/conversion-chart";
import { CurrentCycle } from "@/components/dashboard/current-cycle";
import { MetricsStrip } from "@/components/dashboard/metrics-strip";
import { PageHeading } from "@/components/dashboard/page-heading";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Button } from "@/components/ui/button";

export function DashboardOverview() {
  const [paused, setPaused] = useState(false);

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 pt-2 pb-12 md:px-8">
      <PageHeading
        eyebrow="YOUR WEBSITE, MOVING FORWARD"
        title="A little better, every day."
        description="Here’s what your agent has been working on."
        action={
          <Button
            variant="outline"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play /> : <Pause />}
            {paused ? "Resume agent" : "Pause agent"}
          </Button>
        }
      />
      <MetricsStrip />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.8fr)] lg:gap-16">
        <ConversionChart />
        <CurrentCycle paused={paused} />
      </div>
      <section>
        <SectionTitle
          title="Recent changes"
          action={
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/changes" />}
            >
              All changes
              <ArrowRight />
            </Button>
          }
        />
        <ChangeList limit={3} />
      </section>
    </main>
  );
}
