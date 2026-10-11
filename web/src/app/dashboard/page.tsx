import { PageContainer } from "@/components/layout/page-container";
import { SignedInAs } from "./signed-in-as";
import { LogoutButton } from "@/components/auth/logout-button";

export default function DashboardPage() {
  return (
    <PageContainer className="py-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">Dashboard</h1>
          <SignedInAs />
        </div>
        <LogoutButton />
      </div>
    </PageContainer>
  );
}
