"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Compose is now handled as a modal in the inbox page
// This page redirects to inbox with compose modal open
export default function ComposePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to inbox - compose is now a modal
    router.replace("/inbox?compose=true");
  }, [router]);

  return null;
}
