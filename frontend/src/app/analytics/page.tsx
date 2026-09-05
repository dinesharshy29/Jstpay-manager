"use client";

import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { apiRequest } from "@/lib/api";
import { emptyMetrics, type DashboardMetrics } from "@/lib/dashboard-metrics";

export default function AnalyticsPage() {
	const [range, setRange] = useState("Last 30 days");
	const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
	useEffect(() => { apiRequest<DashboardMetrics>("/api/dashboard/metrics").then(setMetrics).catch(() => undefined); }, []);
	return <ProtectedShell><WorkspaceFrame eyebrow="Risk intelligence" title="Analytics" subtitle="See how your payment volume, success rate, and risk decisions move over time."><section className="toolbar analytics-toolbar"><div className="toolbar-copy"><strong>Payment performance</strong><span>{range} · your workspace only</span></div><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Analytics date range"><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select></section><section className="summary-strip analytics-metrics"><article><span>Payment volume</span><strong>₹{(metrics.total_volume / 100).toLocaleString("en-IN")}</strong><small>Real captured volume</small></article><article><span>Successful payments</span><strong>{metrics.successful_payments}</strong><small>From your records</small></article><article><span>Failed payments</span><strong>{metrics.failed_payments}</strong><small>From your records</small></article><article><span>Risk events</span><strong>{metrics.fraud_events}</strong><small>Not available until modeled</small></article></section><div className="chart-card empty-chart"><strong>No transaction trend data yet</strong><small>Complete more payments to build an analytics history.</small></div></WorkspaceFrame></ProtectedShell>;
}
