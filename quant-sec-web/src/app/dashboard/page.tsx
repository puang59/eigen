"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Dashboard now redirects to inbox (main view)
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inbox");
  }, [router]);

  return null;
}
