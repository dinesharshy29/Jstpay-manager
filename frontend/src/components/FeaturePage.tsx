import Link from "next/link";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";

export function FeaturePage({ eyebrow, title, subtitle, message, action }: { eyebrow: string; title: string; subtitle: string; message: string; action?: { label: string; href: string } }) {
  return <WorkspaceFrame eyebrow={eyebrow} title={title} subtitle={subtitle}><section className="empty-dashboard glass-primary" aria-live="polite"><span className="empty-mark">—</span><span className="section-eyebrow">Workspace state</span><h2>{message}</h2><p>This view is ready for authenticated workspace data. No records are shown until the connected service returns them.</p>{action && <Link className="primary-button" href={action.href}>{action.label}</Link>}</section></WorkspaceFrame>;
}
