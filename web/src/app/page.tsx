import { Suspense } from "react";
import { HomePage } from "@/components/home/home-page";
import { homeMetadata } from "@/lib/seo";
import { isSignedIn } from "@/lib/session";

export const metadata = homeMetadata;

async function SignedInHome() {
  return <HomePage signedIn={await isSignedIn()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<HomePage signedIn={false} />}>
      <SignedInHome />
    </Suspense>
  );
}
