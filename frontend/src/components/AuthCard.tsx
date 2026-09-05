"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

export function AuthCard({ eyebrow, title, subtitle, children, footer }: { eyebrow: string; title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="auth-layout">
      <div className="auth-orbit" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="brand-mark" href="/" aria-label="AI Risk Manager home">
          <span className="brand-symbol">AR</span>
          <span>AI Risk Manager</span>
        </Link>
        <div className="auth-heading">
          <span className="eyebrow">{eyebrow}</span>
          <h1 id="auth-title">{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
        <div className="auth-footer">{footer}</div>
      </section>
    </main>
  );
}

export function PasswordField({ value, onChange, label = "Password", autoComplete = "current-password" }: { value: string; onChange: (value: string) => void; label?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input aria-label={label} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required />
        <button className="visibility-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? "Hide" : "Show"}</button>
      </span>
    </label>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return <button className="primary-button" type="submit" disabled={loading}>{loading ? <span className="spinner" aria-label="Loading" /> : children}</button>;
}

export function FormError({ message }: { message: string }) {
  return message ? <p className="form-error" role="alert">{message}</p> : null;
}

export type FormHandler = (event: FormEvent<HTMLFormElement>) => void;
