import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { mapFirebaseError } from "@/lib/firebase/errors";

function AuthShell({ notice }: { notice?: ReactNode }) {
  return (
    <main className="relative grid min-h-svh place-items-center bg-hero px-5 py-16">
      <Button
        nativeButton={false}
        render={<Link href="/" />}
        variant="ghost"
        className="absolute top-5 left-5"
      >
        <ArrowLeft />
        Go back to home
      </Button>
      <div className="w-full max-w-md rounded-lg border border-border bg-background px-8 py-9 shadow-float">
        <Brand />
        <h1 className="mt-8 mb-2 font-display text-3xl font-semibold">
          Sign in
        </h1>
        <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
          Use Google or GitHub. The same email links both to one account.
        </p>
        {notice}
        <AuthForm />
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to the{" "}
          <Link href="/terms" className="text-foreground underline">
            Terms of use
          </Link>{" "}
          and acknowledge the{" "}
          <Link href="/privacy" className="text-foreground underline">
            Privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {mapFirebaseError(error)}
    </p>
  );
}

export default function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <AuthShell
      notice={
        <Suspense>
          <AuthError searchParams={searchParams} />
        </Suspense>
      }
    />
  );
}
