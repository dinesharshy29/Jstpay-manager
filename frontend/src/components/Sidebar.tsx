"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Workspace", items: [["/dashboard", "Overview", "⌂"], ["/transactions", "Transactions", "↗"], ["/disputes", "Disputes", "◈"], ["/analytics", "Analytics", "⌁"], ["/reports", "Reports", "▤"]] },
  { label: "Risk intelligence", items: [["/risk-monitoring", "Risk monitoring", "◌"], ["/alerts", "Alerts", "!"], ["/rules-policies", "Rules & policies", "◇"], ["/ai-insights", "AI insights", "✦"]] },
  { label: "Payments", items: [["/payments", "Payments", "＋"], ["/payment-links", "Payment links", "↗"], ["/customers", "Customers", "○"], ["/refunds", "Refunds", "↩"]] },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  return <aside className="app-sidebar" aria-label="Primary navigation"><Link href="/dashboard" className="sidebar-brand"><span className="brand-symbol">AR</span><span><b>AI Risk Manager</b><small>Payment intelligence platform</small></span></Link><div className="sidebar-sections">{sections.map((section) => <section key={section.label}><span className="sidebar-label">{section.label}</span>{section.items.map(([href, label, icon]) => <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-current={isActive(href) ? "page" : undefined}><i aria-hidden="true">{icon}</i><span>{label}</span>{label === "Alerts" && <em>0</em>}</Link>)}</section>)}<section><span className="sidebar-label">Settings</span><Link href="/settings/profile" className={isActive("/settings/profile") ? "active" : ""} aria-current={isActive("/settings/profile") ? "page" : undefined}><i aria-hidden="true">⚙</i><span>Profile & workspace</span></Link><Link href="/settings/integrations" className={isActive("/settings/integrations") ? "active" : ""} aria-current={isActive("/settings/integrations") ? "page" : undefined}><i aria-hidden="true">⌘</i><span>Integrations</span></Link><Link href="/settings/preferences" className={isActive("/settings/preferences") ? "active" : ""} aria-current={isActive("/settings/preferences") ? "page" : undefined}><i aria-hidden="true">☷</i><span>Preferences</span></Link></section></div><div className="sidebar-workspace"><span className="sidebar-label">Current workspace</span><div><span className="workspace-avatar">A</span><span><b>Default workspace</b><small>Starter plan</small></span><span className="workspace-chevron">⌄</span></div></div></aside>;
}
