import type { ReactNode } from "react";

export function DashboardSection({ eyebrow, title, action, children, className = "" }: { eyebrow?: string; title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`dashboard-section ${className}`}><div className="section-heading">{eyebrow && <span className="section-eyebrow">{eyebrow}</span>}{title && <h2>{title}</h2>}{action && <div className="section-action">{action}</div>}</div>{children}</section>;
}