"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function SignedInAs() {
  const { user, loading } = useAuth();
  if (loading || !user?.email) return null;

  return (
    <p className="mt-3 text-muted-foreground">Signed in as {user.email}</p>
  );
}
