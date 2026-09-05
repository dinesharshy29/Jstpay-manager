import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function ReportsPage() { return <ProtectedShell><FeaturePage eyebrow="Workspace" title="Reports" subtitle="Build reports from your workspace's financial and risk history." message="No reports yet." action={{ label: "View transactions", href: "/transactions" }} /></ProtectedShell>; }
