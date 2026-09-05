"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { apiRequest } from "@/lib/api";

type Transaction = { id: number; customer_name: string | null; customer_email: string | null; amount: number; currency: string; status: string; fraud_score: number | null; risk_level: string | null; risk_factors: string[]; created_at: string; description: string | null };
type DetailResponse = { transaction: Transaction; risk_events: { event_type: string; score: number; created_at: string }[] };

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest<DetailResponse>(`/api/transactions/${id}`).then(setDetail).catch((reason) => setError(reason instanceof Error ? reason.message : "Transaction could not be loaded.")); }, [id]);
  if (error) return <ProtectedShell><WorkspaceFrame eyebrow="Risk operations" title={`Transaction ${id}`} subtitle="Inspect payment, customer, and risk details for this workspace resource."><div className="dashboard-error" role="alert"><strong>{error}</strong><Link className="text-link" href="/transactions">Back to transactions</Link></div></WorkspaceFrame></ProtectedShell>;
  if (!detail) return <div className="loading-screen">Loading transaction intelligence...</div>;
  const transaction = detail.transaction;
  return <ProtectedShell><WorkspaceFrame eyebrow="Risk operations" title={`Transaction #${transaction.id}`} subtitle="A tenant-scoped view of payment context and explainable risk signals."><div className="detail-actions"><Link className="text-link" href="/transactions">← Back to transactions</Link><span className={`status status-${transaction.risk_level ?? "low"}`}>{transaction.risk_level ?? "unscored"} risk</span></div><div className="transaction-detail-grid"><section className="glass-primary detail-card"><span className="section-eyebrow">Payment</span><h2>{transaction.currency} {(transaction.amount / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</h2><dl><div><dt>Status</dt><dd>{transaction.status}</dd></div><div><dt>Customer</dt><dd>{transaction.customer_name ?? "Not provided"}</dd></div><div><dt>Email</dt><dd>{transaction.customer_email ?? "Not provided"}</dd></div><div><dt>Created</dt><dd>{new Date(transaction.created_at).toLocaleString()}</dd></div><div><dt>Description</dt><dd>{transaction.description ?? "Not provided"}</dd></div></dl></section><section className="glass-primary detail-card risk-detail-card"><span className="section-eyebrow">Explainable risk</span><strong className="risk-score-value">{transaction.fraud_score ?? 0}<small>/100</small></strong><p>This score is calculated from transaction signals and stored with the record.</p><h3>Risk factors</h3>{transaction.risk_factors.length ? <ul>{transaction.risk_factors.map((factor) => <li key={factor}>{factor.replaceAll("_", " ")}</li>)}</ul> : <p>No risk factors detected.</p>}</section></div><section className="glass-primary detail-card risk-timeline"><span className="section-eyebrow">Risk timeline</span>{detail.risk_events.length ? detail.risk_events.map((event) => <div key={`${event.event_type}-${event.created_at}`}><i /><strong>{event.event_type.replaceAll("_", " ")}</strong><span>Score {event.score} · {new Date(event.created_at).toLocaleString()}</span></div>) : <p>No risk events recorded for this transaction.</p>}</section></WorkspaceFrame></ProtectedShell>;
}
