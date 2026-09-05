import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function AlertsPage() { return <ProtectedShell><FeaturePage eyebrow="Risk intelligence" title="Alerts" subtitle="Review workspace events that need attention." message="No alerts yet." action={{ label: "Open risk monitoring", href: "/risk-monitoring" }} /></ProtectedShell>; }
