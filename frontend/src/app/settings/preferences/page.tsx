import { FeaturePage } from "@/components/FeaturePage";
import { ProtectedShell } from "@/components/ProtectedShell";

export default function PreferencesPage() { return <ProtectedShell><FeaturePage eyebrow="Settings" title="Preferences" subtitle="Set workspace display and notification preferences." message="Preferences have not been configured." /></ProtectedShell>; }
