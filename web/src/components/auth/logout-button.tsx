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

      const response = await fetch("/api/logout");

      if (!response.ok) {
        throw new Error("Failed to clear session");
      }

      router.replace("/");
      router.refresh();
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
