import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function PaymentLinksPage() { return <ProtectedShell><FeaturePage eyebrow="Payments" title="Payment links" subtitle="Create and manage links backed by your payment processor." message="No payment links yet." action={{ label: "Open payments", href: "/payments" }} /></ProtectedShell>; }
