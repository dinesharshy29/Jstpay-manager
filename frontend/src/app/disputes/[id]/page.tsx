import { ProtectedShell } from "@/components/ProtectedShell";
import { FeaturePage } from "@/components/FeaturePage";

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProtectedShell><FeaturePage eyebrow="Risk operations" title={`Dispute ${id}`} subtitle="Review case details, evidence, timelines, and supported actions for this workspace resource." message="Dispute details are not available from the connected API." action={{ label: "Back to disputes", href: "/disputes" }} /></ProtectedShell>;
}
