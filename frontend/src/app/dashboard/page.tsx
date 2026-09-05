"use client";

import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { emptyMetrics, type DashboardMetrics } from "@/lib/dashboard-metrics";
import { AddPaymentModal } from "@/components/AddPaymentModal";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import { QuickActions } from "@/components/QuickActions";

function DashboardContent() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  useEffect(() => { apiRequest<DashboardMetrics>("/api/dashboard/metrics").then(setMetrics).catch(() => setError(true)).finally(() => setLoading(false)); }, []);
  const hasActivity = metrics.total_transactions > 0;
  return <WorkspaceFrame eyebrow="Command center" title="Your risk command center." subtitle="Monitor payment activity, surface emerging threats, and resolve disputes with AI-powered intelligence."><div className="hero-status"><i /> Risk monitoring active <span>·</span> {error ? "Connection unavailable" : "All systems operational"}</div>{error && <div className="dashboard-error" role="alert"><strong>Risk intelligence temporarily unavailable.</strong><button onClick={() => window.location.reload()} type="button">Retry</button></div>}<section className="metric-grid premium-metrics"><Metric label="Total transactions" value={loading ? "..." : metrics.total_transactions.toLocaleString()} detail="From your workspace" /><Metric label="Payment volume" value={loading ? "..." : formatRupees(metrics.total_volume)} detail="Captured payments only" /><Metric label="Fraud prevented" value={loading ? "..." : formatRupees(metrics.fraud_prevented)} detail={metrics.fraud_events ? `${metrics.fraud_events} risk events` : "Not available yet"} /><Metric label="Chargebacks" value={loading ? "..." : metrics.chargebacks.toLocaleString()} detail={metrics.disputes ? `${metrics.disputes} disputes` : "No disputes yet"} /></section><div className="dashboard-columns"><div>{!loading && !hasActivity ? <EmptyDashboard onAddPayment={() => setShowPayment(true)} /> : <ActivitySummary metrics={metrics} />}<QuickActions onAddPayment={() => setShowPayment(true)} /></div><AIAssistantPanel /></div>{showPayment && <AddPaymentModal onClose={() => setShowPayment(false)} onCreated={() => window.location.reload()} />}</WorkspaceFrame>;
}

function formatRupees(paise: number) { return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="metric-card glass-secondary"><div className="metric-card-top"><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></article>; }
function EmptyDashboard({ onAddPayment }: { onAddPayment: () => void }) { return <section className="empty-dashboard glass-primary"><span className="empty-mark">+</span><span className="section-eyebrow">A clean start</span><h2>No payment activity yet.</h2><p>Create your first payment to begin building your risk profile.</p><div><button className="primary-button" onClick={onAddPayment} type="button">Add Payment</button><button className="secondary-button" type="button">Create Payment Link</button><button className="text-button" type="button">Connect Razorpay <span>→</span></button></div><div className="empty-panels"><article><strong>No transaction data yet</strong><small>Complete your first payment to see volume trends.</small></article><article><strong>No risk events yet</strong><small>Risk intelligence will appear as history grows.</small></article></div></section>; }
function ActivitySummary({ metrics }: { metrics: DashboardMetrics }) { return <section className="empty-dashboard glass-primary activity-summary"><span className="section-eyebrow">Workspace activity</span><h2>{metrics.successful_payments ? "Your payment activity is building." : "Payments are being monitored."}</h2><p>Risk analysis will appear here as your transaction history grows.</p><div className="summary-strip"><article><span>Successful payments</span><strong>{metrics.successful_payments}</strong></article><article><span>Pending payments</span><strong>{metrics.pending_payments}</strong></article><article><span>Refunds</span><strong>{metrics.refunds}</strong></article><article><span>Payment links</span><strong>{metrics.payment_links}</strong></article></div></section>; }
export default function DashboardPage() { return <ProtectedShell><DashboardContent /></ProtectedShell>; }
