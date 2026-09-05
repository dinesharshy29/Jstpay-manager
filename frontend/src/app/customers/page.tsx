import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function CustomersPage() { return <ProtectedShell><FeaturePage eyebrow="Payments" title="Customers" subtitle="Review customers derived from payments in your workspace." message="No customers yet." action={{ label: "View payments", href: "/payments" }} /></ProtectedShell>; }
