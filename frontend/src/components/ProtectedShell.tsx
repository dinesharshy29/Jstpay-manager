"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function ProtectedShell({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) return <div className="loading-screen">Checking your secure session...</div>;
  return <>{children}</>;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) return <div className="loading-screen">Preparing your secure workspace...</div>;
  return <>{children}</>;
}
