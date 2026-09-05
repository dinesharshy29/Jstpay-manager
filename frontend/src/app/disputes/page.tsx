"use client";

import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { apiRequest } from "@/lib/api";

type Dispute = { id: number; amount: number; status: string; created_at: string };

export default function DisputesPage() {
	const [filter, setFilter] = useState("All disputes");
	const [disputes, setDisputes] = useState<Dispute[]>([]);
	const [error, setError] = useState(false);
	useEffect(() => { apiRequest<{ items: Dispute[] }>("/api/disputes").then((response) => setDisputes(response.items)).catch(() => setError(true)); }, []);
	const visible = disputes.filter((dispute) => filter === "All disputes" || dispute.status === filter.toLowerCase());
	return <ProtectedShell><WorkspaceFrame eyebrow="Risk operations" title="Disputes" subtitle="Keep every case moving with clear deadlines, evidence, and outcomes in one place."><section className="summary-strip"><article><span>Open cases</span><strong>{disputes.filter((dispute) => dispute.status === "open").length}</strong><small>From your workspace</small></article><article><span>At risk</span><strong>₹{disputes.filter((dispute) => dispute.status === "open").reduce((sum, dispute) => sum + dispute.amount, 0) / 100}</strong><small>Open dispute value</small></article><article><span>Win rate</span><strong>—</strong><small>Not available yet</small></article></section><section className="toolbar"><div className="toolbar-copy"><strong>Case queue</strong><span>{visible.length} of {disputes.length} disputes</span></div><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter disputes"><option>All disputes</option><option>Open</option><option>Won</option></select></section>{error && <div className="dashboard-error" role="alert"><strong>Disputes temporarily unavailable.</strong><button onClick={() => window.location.reload()} type="button">Retry</button></div>}<div className="table-card"><div className="dispute-table">{!error && visible.length === 0 && <p className="empty-state">No disputes yet.</p>}{visible.map((dispute) => <div className="dispute-row" key={dispute.id}><div><strong>Dispute #{dispute.id}</strong><small>Created {new Date(dispute.created_at).toLocaleString()}</small></div><span>Owned by your workspace</span><strong>₹{(dispute.amount / 100).toLocaleString("en-IN")}</strong><span className={`status status-${dispute.status}`}>{dispute.status}</span><small>Review details</small></div>)}</div></div></WorkspaceFrame></ProtectedShell>;
}
