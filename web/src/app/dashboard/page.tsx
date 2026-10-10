import { Suspense } from "react";
import { headers } from "next/headers";
import { PageContainer } from "@/components/layout/page-container";

async function SignedInAs() {
  const email = (await headers()).get("x-user-email");
  if (!email) return null;

  return <p className="mt-3 text-muted-foreground">Signed in as {email}</p>;
}

export default function DashboardPage() {
  return (
    <PageContainer className="py-24">
      <h1 className="font-display text-4xl font-semibold">Dashboard</h1>
      <Suspense>
        <SignedInAs />
      </Suspense>
    </PageContainer>
  );
}
