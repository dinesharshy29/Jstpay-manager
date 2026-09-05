import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function AIInsightsPage() { return <ProtectedShell><FeaturePage eyebrow="Risk intelligence" title="AI insights" subtitle="Understand emerging risk patterns from connected intelligence services." message="AI insights are not connected yet." action={{ label: "Open transactions", href: "/transactions" }} /></ProtectedShell>; }
