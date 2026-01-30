'use client';

import type { ReactElement } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./navbar.module.css";

export default function LogoutButton(): ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleLogout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.replace("/login");
    });
  }

  return (
    <button
      type="button"
      className={styles.logoutButton}
      onClick={handleLogout}
      disabled={isPending}
      aria-label="Sign out"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
