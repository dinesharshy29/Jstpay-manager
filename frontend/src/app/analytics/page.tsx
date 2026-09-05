"use client";

import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { apiRequest } from "@/lib/api";
import { emptyMetrics, type DashboardMetrics } from "@/lib/dashboard-metrics";

type AnalyticsPoint = { date: string; transactions: number; volume: number; successful: number; failed: number; high_risk: number };

export default function AnalyticsPage() {
	const [range, setRange] = useState("Last 30 days");
	const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
		const [points, setPoints] = useState<AnalyticsPoint[]>([]);
		useEffect(() => { const days = range === "Last 7 days" ? 7 : range === "Last 90 days" ? 90 : 30; Promise.all([apiRequest<DashboardMetrics>("/api/dashboard/metrics"), apiRequest<{ items: AnalyticsPoint[] }>(`/api/analytics?days=${days}`)]).then(([nextMetrics, nextSeries]) => { setMetrics(nextMetrics); setPoints(nextSeries.items); }).catch(() => undefined); }, [range]);
		const maxVolume = Math.max(...points.map((point) => Number(point.volume)), 1);
		return <ProtectedShell><WorkspaceFrame eyebrow="Risk intelligence" title="Analytics" subtitle="See how your payment volume, success rate, and risk decisions move over time."><section className="toolbar analytics-toolbar"><div className="toolbar-copy"><strong>Payment performance</strong><span>{range} · your workspace only</span></div><select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Analytics date range"><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select></section><section className="summary-strip analytics-metrics"><article><span>Payment volume</span><strong>₹{(metrics.total_volume / 100).toLocaleString("en-IN")}</strong><small>Real captured volume</small></article><article><span>Successful payments</span><strong>{metrics.successful_payments}</strong><small>From your records</small></article><article><span>Failed payments</span><strong>{metrics.failed_payments}</strong><small>From your records</small></article><article><span>Risk events</span><strong>{metrics.fraud_events}</strong><small>Persisted risk events</small></article></section><section className="chart-card data-chart"><div className="chart-heading"><strong>Captured volume by day</strong><span>Backend-derived series</span></div><div className="bar-chart">{points.map((point) => <div className="bar-column" key={point.date} title={`${point.date}: ₹${(Number(point.volume) / 100).toLocaleString("en-IN")}`}><i style={{ height: `${Math.max(4, (Number(point.volume) / maxVolume) * 100)}%` }} /><small>{new Date(point.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small></div>)}</div></section></WorkspaceFrame></ProtectedShell>;
}
