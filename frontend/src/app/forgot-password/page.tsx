"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard, FormError, SubmitButton } from "@/components/AuthCard";
import { PublicOnly } from "@/components/ProtectedShell";
import { resetPassword } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try { await resetPassword(email); setSent(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to send reset email."); }
    finally { setLoading(false); }
  }
  return <PublicOnly><AuthCard eyebrow="Account recovery" title="Reset your password" subtitle="We will send recovery instructions to your email address." footer={<p>Remembered it? <Link href="/login">Return to sign in</Link></p>}>
    {sent ? <div className="success-state" role="status"><strong>Password reset email sent</strong><p>Check your inbox for the next step. For your privacy, we do not disclose account existence.</p><Link className="text-link" href="/login">Back to sign in</Link></div> : <form className="auth-form" onSubmit={handleSubmit}><label className="field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required /></label><FormError message={error} /><SubmitButton loading={loading}>Send reset email</SubmitButton></form>}
  </AuthCard></PublicOnly>;
}
