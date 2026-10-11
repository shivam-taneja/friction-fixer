"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client-app";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await signOut(getFirebaseAuth());
      router.replace("/");
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => void logout()}
    >
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
