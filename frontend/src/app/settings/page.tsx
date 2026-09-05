"use client";

import { useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";

export default function SettingsPage() {
	const [alerts, setAlerts] = useState(true);
	const [testMode, setTestMode] = useState(true);
	return <ProtectedShell><WorkspaceFrame eyebrow="Workspace controls" title="Settings" subtitle="Shape how your team works, receives alerts, and connects to payment infrastructure."><div className="settings-layout"><aside className="settings-menu"><button className="selected" type="button">Workspace</button><button type="button">Notifications</button><button type="button">Team access</button><button type="button">API keys</button></aside><div className="settings-content"><section className="settings-section"><div><span className="eyebrow">Workspace profile</span><h2>Workspace details</h2><p>These details appear across your risk operations workspace.</p></div><label className="field"><span>Workspace name</span><input defaultValue="Acme Commerce" /></label><label className="field"><span>Default currency</span><select defaultValue="USD"><option>USD - US Dollar</option><option>EUR - Euro</option><option>GBP - British Pound</option></select></label></section><section className="settings-section"><div><span className="eyebrow">Preferences</span><h2>Operational defaults</h2><p>Control how your team sees activity and receives updates.</p></div><label className="toggle-row"><span><strong>Test mode</strong><small>Keep new activity isolated from production.</small></span><input type="checkbox" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} /></label><label className="toggle-row"><span><strong>Risk alerts</strong><small>Notify the team when a payment needs review.</small></span><input type="checkbox" checked={alerts} onChange={(event) => setAlerts(event.target.checked)} /></label></section><button className="primary-button save-button" type="button">Save changes</button></div></div></WorkspaceFrame></ProtectedShell>;
}
