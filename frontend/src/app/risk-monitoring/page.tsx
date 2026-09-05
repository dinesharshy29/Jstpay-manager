import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function RiskMonitoringPage() { return <ProtectedShell><FeaturePage eyebrow="Risk intelligence" title="Risk monitoring" subtitle="Track risk signals and model health across your workspace." message="Risk model is not connected." action={{ label: "View transactions", href: "/transactions" }} /></ProtectedShell>; }
