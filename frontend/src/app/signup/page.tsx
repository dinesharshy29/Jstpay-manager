"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, FormError, PasswordField, SubmitButton } from "@/components/AuthCard";
import { PublicOnly } from "@/components/ProtectedShell";
import { signUp } from "@/services/auth.service";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Use a password with at least 6 characters."); return; }
    setLoading(true);
    try { await signUp(email, password); router.replace("/dashboard"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create account."); }
    finally { setLoading(false); }
  }
  return <PublicOnly><AuthCard eyebrow="Start clearly" title="Create your account" subtitle="A private workspace for making better risk decisions." footer={<p>Already have an account? <Link href="/login">Sign in</Link></p>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required /></label>
      <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" />
      <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <FormError message={error} />
      <SubmitButton loading={loading}>Create account</SubmitButton>
    </form>
  </AuthCard></PublicOnly>;
}
