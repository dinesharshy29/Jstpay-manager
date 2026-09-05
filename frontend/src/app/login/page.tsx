"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthCard, FormError, PasswordField, SubmitButton } from "@/components/AuthCard";
import { PublicOnly } from "@/components/ProtectedShell";
import { signIn } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setLoading(true);
    try { await signIn(email, password); router.replace("/dashboard"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in."); }
    finally { setLoading(false); }
  }

  return <PublicOnly><AuthCard eyebrow="Secure access" title="Welcome back" subtitle="Your risk operations workspace, calm and ready." footer={<p>New to AI Risk Manager? <Link href="/signup">Create an account</Link></p>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required /></label>
      <PasswordField value={password} onChange={setPassword} />
      <div className="form-row"><span /> <Link href="/forgot-password">Forgot password?</Link></div>
      <FormError message={error} />
      <SubmitButton loading={loading}>Sign in</SubmitButton>
    </form>
  </AuthCard></PublicOnly>;
}
