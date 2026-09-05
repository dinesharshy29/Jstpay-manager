import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function PaymentsPage() { return <ProtectedShell><FeaturePage eyebrow="Payments" title="Payments" subtitle="Create and inspect payments through your connected payment processor." message="Razorpay is not connected." action={{ label: "Open settings", href: "/settings/integrations" }} /></ProtectedShell>; }
