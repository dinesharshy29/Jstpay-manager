"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export function Topbar({ title }: { title: string }) {
  const { user, role } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AR";
  return <header className="app-topbar glass-primary"><div className="topbar-title"><span className="mobile-brand">AR</span><span className="breadcrumb-muted">Workspace</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div><label className="global-search"><span aria-hidden="true">⌕</span><input placeholder="Search anything..." aria-label="Search anything" /></label><div className="topbar-actions">{role === "guest" && <Link className="guest-demo-link" href="/guest-demo">🎯 Guest Demo</Link>}<button className="topbar-icon" type="button" aria-label="Help">?</button><button className="topbar-icon notification-button" type="button" aria-label="Notifications"><span />◌</button><span className="topbar-divider" /><span className="user-avatar" aria-hidden="true">{initials}</span><span className="topbar-user"><b>{user?.displayName || "Workspace admin"}</b><small>{role === "guest" ? "Guest" : "Admin"}</small></span></div></header>;
}
