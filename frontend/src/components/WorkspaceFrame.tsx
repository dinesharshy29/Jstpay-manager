"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function WorkspaceFrame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: ReactNode }) {
  return <div className="dashboard-shell"><div className="ambient-glow glow-one" /><div className="ambient-glow glow-two" /><Sidebar /><div className="app-content"><Topbar title={title} /><main className="workspace-main"><div className="workspace-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="dashboard-lede">{subtitle}</p></div>{children}</main></div></div>;
}