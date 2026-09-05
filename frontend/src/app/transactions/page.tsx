"use client";

import { useEffect, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WorkspaceFrame } from "@/components/WorkspaceFrame";
import { apiRequest } from "@/lib/api";

type Transaction = { id: number; customer_name: string | null; amount: number; currency: string; payment_method: string | null; status: string; created_at: string };
type TransactionResponse = { items: Transaction[]; total: number };

export default function TransactionsPage() {
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("All statuses");
	const [result, setResult] = useState<TransactionResponse>({ items: [], total: 0 });
	const [error, setError] = useState(false);
	useEffect(() => { apiRequest<TransactionResponse>("/api/transactions").then(setResult).catch(() => setError(true)); }, []);
	const filtered = result.items.filter((transaction) => `${transaction.id} ${transaction.customer_name ?? ""}`.toLowerCase().includes(query.toLowerCase()) && (status === "All statuses" || transaction.status === status.toLowerCase()));

	return <ProtectedShell><WorkspaceFrame eyebrow="Risk operations" title="Transactions" subtitle="A live view of payment activity, exceptions, and the signals behind every decision."><section className="toolbar"><label className="search-field"><span>Search transactions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID or customer" /></label><label className="select-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Captured</option><option>Pending</option><option>Failed</option></select></label></section>{error && <div className="dashboard-error" role="alert"><strong>Transactions temporarily unavailable.</strong><button onClick={() => window.location.reload()} type="button">Retry</button></div>}<div className="table-card"><div className="table-summary"><strong>{filtered.length} of {result.total} transactions</strong><span>Owned by your workspace</span></div><div className="transaction-table" role="table" aria-label="Transactions">{filtered.map((transaction) => <div className="transaction-row" key={transaction.id} role="row"><div><strong>{transaction.customer_name ?? "Customer unavailable"}</strong><small>#{transaction.id}</small></div><span>{transaction.payment_method ?? "Not available"}</span><strong>{transaction.currency} {(transaction.amount / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong><span className={`status status-${transaction.status}`}>{transaction.status}</span><small>{new Date(transaction.created_at).toLocaleString()}</small></div>)}{!error && filtered.length === 0 && <p className="empty-state">No payment activity yet.</p>}</div></div></WorkspaceFrame></ProtectedShell>;
}
