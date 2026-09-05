import { ProtectedShell } from "@/components/ProtectedShell";
import { FeaturePage } from "@/components/FeaturePage";

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProtectedShell><FeaturePage eyebrow="Risk operations" title={`Transaction ${id}`} subtitle="Inspect payment, customer, risk, refund, and dispute details for this workspace resource." message="Transaction details are not available from the connected API." action={{ label: "Back to transactions", href: "/transactions" }} /></ProtectedShell>;
}
