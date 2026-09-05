"use client";

import { useState, type FormEvent } from "react";
import Script from "next/script";
import { apiRequest } from "@/lib/api";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; } }

type OrderResponse = { key_id: string; order_id: string; amount: number; currency: string };

export function AddPaymentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError("Enter an amount greater than zero."); return; }
    setLoading(true);
    try {
      const order = await apiRequest<OrderResponse>("/api/orders", { method: "POST", body: JSON.stringify({ amount: numericAmount, currency, description, customer_name: customerName, customer_email: customerEmail, customer_phone: customerPhone }) });
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable. Check the payment configuration.");
      const checkout = new window.Razorpay({ key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency, name: "AI Risk Manager", description: description || "Secure payment", prefill: { name: customerName, email: customerEmail, contact: customerPhone }, handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => { try { await apiRequest("/api/payments/verify", { method: "POST", body: JSON.stringify(response) }); onCreated(); onClose(); } catch { setError("Payment was received by checkout but could not be verified yet."); } } });
      checkout.open();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment could not be created."); }
    finally { setLoading(false); }
  }

  return <><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" /><div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="payment-modal glass-primary" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title"><button className="drawer-close" onClick={onClose} type="button" aria-label="Close payment form">×</button><span className="section-eyebrow">Secure payment</span><h2 id="payment-modal-title">Add a payment</h2><p>Create a Razorpay TEST MODE order for your workspace.</p><form className="payment-form" onSubmit={createPayment}><div className="amount-row"><label className="field"><span>Amount</span><input inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label><label className="field"><span>Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>INR</option><option>USD</option><option>EUR</option></select></label></div><label className="field"><span>Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this payment for?" maxLength={255} /></label><div className="modal-divider"><span>Customer details</span></div><label className="field"><span>Name</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name" /></label><label className="field"><span>Email</span><input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="customer@example.com" /></label><label className="field"><span>Phone</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="+91 98765 43210" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={loading} type="submit">{loading ? "Creating secure order..." : "Create secure payment"}</button></form></section></div></>;
}
