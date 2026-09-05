"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { apiRequest } from "@/lib/api";

type RiskEvent = { id: number; transaction_id: number | null; event_type: string; score: number; risk_level: string | null; customer_name: string | null; created_at: string };

export default function AlertsPage() { const [events, setEvents] = useState<RiskEvent[]>([]); const [error, setError] = useState(""); useEffect(() => { apiRequest<{ items: RiskEvent[] }>("/api/risk/events").then((result) => setEvents(result.items)).catch((reason) => setError(reason instanceof Error ? reason.message : "Alerts could not be loaded.")); }, []); return <ProtectedShell><WorkspaceFrame eyebrow="Risk intelligence" title="Alerts" subtitle="Review explainable risk events generated from your workspace transactions."><div className="alert-summary"><strong>{events.length}</strong><span>flagged events in the latest activity window</span></div>{error && <div className="dashboard-error" role="alert"><strong>{error}</strong><button onClick={() => window.location.reload()} type="button">Retry</button></div>}<section className="alerts-panel glass-primary">{!error && events.length === 0 && <p className="empty-state">No high-risk events have been recorded yet.</p>}{events.map((event) => <Link className="alert-row" href={event.transaction_id ? `/transactions/${event.transaction_id}` : "/transactions"} key={event.id}><span className={`alert-mark ${event.risk_level ?? "high"}`}>!</span><span className="alert-copy"><strong>{event.event_type.replaceAll("_", " ")}</strong><small>Transaction #{event.transaction_id ?? "unknown"} · {event.customer_name ?? "Customer unavailable"}</small></span><time>{event.score}/100</time><span aria-hidden="true">→</span></Link>)}</section></WorkspaceFrame></ProtectedShell>; }
