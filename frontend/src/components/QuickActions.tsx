import Link from "next/link";

export function QuickActions({ onAddPayment }: { onAddPayment: () => void }) {
  return <section className="quick-actions"><div><span className="section-eyebrow">Get started</span><h2>Build your first signal</h2></div><div className="quick-action-grid"><button type="button" onClick={onAddPayment}><span className="action-icon">＋</span><span><b>Add Payment</b><small>Create a secure Razorpay order.</small></span><i>→</i></button><Link href="/transactions"><span className="action-icon">⌕</span><span><b>Analyze a transaction</b><small>Check payment risk before proceeding.</small></span><i>→</i></Link><button type="button" disabled><span className="action-icon">↗</span><span><b>Create Payment Link</b><small>Share a checkout link with customers.</small></span><i>→</i></button></div></section>;
}
