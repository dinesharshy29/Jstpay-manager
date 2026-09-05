import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function IntegrationsPage() { return <ProtectedShell><FeaturePage eyebrow="Settings" title="Integrations" subtitle="Connect payment, identity, risk, and AI services without exposing secrets." message="No integrations configured." /></ProtectedShell>; }
