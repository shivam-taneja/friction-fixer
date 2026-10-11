"use client";

import { useState } from "react";
import { ChangeList } from "@/components/dashboard/change-list";
import { PageHeading } from "@/components/dashboard/page-heading";
import { useWorkspace } from "@/components/dashboard/use-workspace";
import {
  changeFilters,
  type ChangeFilter,
} from "@/components/dashboard/workspace";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ChangesPage() {
  const [filter, setFilter] = useState<ChangeFilter>("All");
  const { changes } = useWorkspace();

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 pt-2 pb-12 md:px-8">
      <PageHeading
        eyebrow="SMALL CHANGES. MEASURABLE RESULTS."
        title="Every fix has a story."
        description="Review the reasoning. Follow the result. Keep what works."
      />
      <div>
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as ChangeFilter)}
          className="mb-6"
        >
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            {changeFilters.map((item) => (
              <TabsTrigger key={item} value={item} className="gap-2">
                {item}
                <span className="text-muted-foreground">
                  {item === "All"
                    ? changes.length
                    : changes.filter((change) => change.status === item).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ChangeList filter={filter} />
      </div>
    </main>
  );
}
