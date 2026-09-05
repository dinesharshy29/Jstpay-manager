import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function RefundsPage() { return <ProtectedShell><FeaturePage eyebrow="Payments" title="Refunds" subtitle="Track refunds initiated for payments owned by your workspace." message="No refunds yet." action={{ label: "View transactions", href: "/transactions" }} /></ProtectedShell>; }
