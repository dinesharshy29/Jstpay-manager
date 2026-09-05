import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function ProfilePage() { return <ProtectedShell><FeaturePage eyebrow="Settings" title="Profile & workspace" subtitle="Manage your authenticated profile and current workspace." message="Profile settings are not connected yet." /></ProtectedShell>; }
