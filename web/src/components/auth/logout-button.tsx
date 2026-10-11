"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client-app";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { notify } from "@/components/ui/toast";

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
      notify.error("Could not sign out. Try again.");
      setPending(false);
    }
  }

  return (
    <DropdownMenuItem disabled={pending} onClick={() => void logout()}>
      <LogOut />
      {pending ? "Signing out…" : "Log out"}
    </DropdownMenuItem>
  );
}
