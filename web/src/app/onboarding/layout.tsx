import { getServerUser } from "@/lib/auth/request-user";
import { OnboardingStatus } from "@/lib/db/schema/user";
import { getUserProfile } from "@/lib/db/users";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth");
  }

  const profile = await getUserProfile(user.userId);

  if (profile?.onboarding.status === OnboardingStatus.complete) {
    redirect("/dashboard/runs");
  }

  return children;
}
