import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function RulesPoliciesPage() { return <ProtectedShell><FeaturePage eyebrow="Risk intelligence" title="Rules & policies" subtitle="Manage workspace rules for payment review and risk operations." message="No rules configured." action={{ label: "View risk monitoring", href: "/risk-monitoring" }} /></ProtectedShell>; }
