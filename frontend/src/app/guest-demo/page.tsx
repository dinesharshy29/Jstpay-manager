"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedShell } from "@/components/ProtectedShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiRequest } from "@/lib/api";
import { guestDemoCameras, guestDemoFeatureCards, guestDemoJourney, guestDemoMetrics, guestDemoSteps } from "@/lib/guest-demo-data";

const sections = ["Welcome", "How it works", "Multi-camera", "Live demo", "Journey", "Privacy", "Access"];

function GuestDemoContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    apiRequest<{ role: string }>("/api/demo/guest").then((result) => setVerified(result.role === "guest")).catch(() => router.replace("/dashboard"));
  }, [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") router.push("/dashboard"); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  if (!verified) return <div className="loading-screen">Preparing your guest demo...</div>;

  const goTo = (nextStep: number) => setStep(Math.max(0, Math.min(sections.length - 1, nextStep)));
  return <main className="guest-demo" aria-labelledby="guest-demo-title">
    <header className="guest-demo-topbar">
      <div className="guest-demo-brand"><span className="guest-demo-mark">RE</span><span><strong>RetailEye</strong><small>Guest demonstration</small></span></div>
      <div className="guest-demo-top-actions"><span className="demo-data-badge">Demo data</span><span className="guest-demo-user">{user?.email}</span><button className="demo-exit-button" onClick={() => router.push("/dashboard")} type="button">Exit demo <span aria-hidden="true">×</span></button></div>
    </header>
    <div className="guest-demo-layout">
      <aside className="guest-demo-sidebar" aria-label="Demo sections"><div className="demo-progress-label"><span>Guided tour</span><strong>Step {step + 1} of {sections.length}</strong></div><div className="demo-progress"><i style={{ width: `${((step + 1) / sections.length) * 100}%` }} /></div><nav>{sections.map((label, index) => <button className={index === step ? "active" : index < step ? "visited" : ""} key={label} onClick={() => goTo(index)} type="button"><span>{String(index + 1).padStart(2, "0")}</span>{label}</button>)}</nav><p className="demo-sidebar-note">Read-only experience<br />No production data is changed.</p></aside>
      <div className="guest-demo-content">
        {step === 0 && <section className="demo-section demo-hero"><div className="demo-kicker">People-flow intelligence · read-only demo</div><h1 id="guest-demo-title">See every customer journey,<br /><em>without counting twice.</em></h1><p className="demo-hero-copy">RetailEye turns multiple camera feeds into real-time people-flow intelligence. Explore how AI detects, tracks, and anonymously matches people across a store.</p><div className="demo-hero-actions"><button className="demo-primary-button" onClick={() => goTo(1)} type="button">Start the tour <span aria-hidden="true">→</span></button><span className="demo-hero-caption">About 3 minutes · 7 chapters</span></div><div className="demo-hero-visual"><div className="demo-scan-line" /><div className="demo-visual-grid">{["CAM 01", "CAM 02", "CAM 03"].map((camera, index) => <div className="demo-vision-panel" key={camera}><span>{camera}</span><i className={`demo-person demo-person-${index + 1}`} /><i className="demo-detection-box" /><small>{index === 0 ? "ENTRY ZONE" : index === 1 ? "ZONE A" : "EXIT ZONE"}</small></div>)}</div><div className="demo-visual-footer"><span><i className="online-dot" /> Live simulation</span><strong>GP_000123 <small>→ moving across cameras</small></strong></div></div></section>}
        {step === 1 && <DemoHowItWorks />}
        {step === 2 && <DemoMultiCamera />}
        {step === 3 && <DemoLive />}
        {step === 4 && <DemoJourney />}
        {step === 5 && <DemoPrivacy />}
        {step === 6 && <DemoAccess />}
        <footer className="demo-navigation"><button disabled={step === 0} onClick={() => goTo(step - 1)} type="button">← Back</button><span>{sections[step]}</span><button className="demo-next" disabled={step === sections.length - 1} onClick={() => goTo(step + 1)} type="button">Next →</button></footer>
      </div>
    </div>
  </main>;
}

function DemoHowItWorks() { return <section className="demo-section"><DemoHeading eyebrow="The system, end to end" title="From camera frame to store intelligence" intro="Every layer has one job. Together, they create a live view of how people move through a space." /><div className="demo-pipeline">{guestDemoSteps.map((item, index) => <div className="pipeline-step" key={item.title}><div className="pipeline-icon">{item.icon}</div><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.detail}</p>{index < guestDemoSteps.length - 1 && <b aria-hidden="true">↓</b>}</div>)}</div><div className="demo-callout"><strong>Local Track ID ≠ Global Person ID</strong><span>A local ID belongs to one camera. The global identity engine connects those local observations without naming the person.</span></div></section>; }
function DemoMultiCamera() { return <section className="demo-section"><DemoHeading eyebrow="Multi-camera intelligence" title="One person. Many camera views." intro="RetailEye keeps the camera-specific tracking detail while maintaining one anonymous identity across the store." /><div className="identity-map"><div className="identity-column"><span>Camera observations</span><div><strong>Camera 01</strong><small>Local track ID 42</small></div><div><strong>Camera 02</strong><small>Local track ID 17</small></div><div><strong>Camera 04</strong><small>Local track ID 08</small></div></div><div className="identity-connector"><i /><i /><i /><strong>Re-ID<br />matching</strong></div><div className="identity-result"><span>Anonymous global identity</span><strong>GP_000123</strong><small><i className="online-dot" /> Same person · 94.7% match confidence</small></div></div><div className="duplicate-grid"><div><span>Without Re-ID</span><strong>3 customers</strong><small>Camera 01 + 02 + 04 are counted independently.</small></div><div className="duplicate-grid-result"><span>With global identity</span><strong>1 unique customer</strong><small>Three observations resolve to the same anonymous journey.</small></div></div></section>; }
function DemoLive() { return <section className="demo-section"><DemoHeading eyebrow="Simulated live view" title="A calm picture of a busy store" intro="This is clearly labeled demo data. The camera cards show how health, local tracks, and occupancy appear together." /><div className="demo-metrics-grid">{guestDemoMetrics.map(([label, value, detail]) => <div className="demo-metric" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>)}</div><div className="demo-camera-grid">{guestDemoCameras.map(([camera, people, zone, fps, tracks]) => <article className="demo-camera-card" key={camera}><div className="camera-preview"><span>{camera}</span><i className="camera-frame-person" /><b><i className="online-dot" /> Online</b><small>{zone}</small></div><div className="camera-card-footer"><strong>{people} <small>people detected</small></strong><span>{fps}<br />{tracks}</span></div></article>)}</div><div className="demo-feature-grid">{guestDemoFeatureCards.map(([title, detail]) => <article key={title}><strong>{title}</strong><p>{detail}</p></article>)}</div></section>; }
function DemoJourney() { return <section className="demo-section"><DemoHeading eyebrow="Example customer journey" title="Follow one anonymous visit" intro="Events become useful when they connect. This timeline shows how a single journey updates the store picture." /><div className="journey-timeline">{guestDemoJourney.map(([time, title, detail], index) => <div className="journey-event" key={time}><time>{time}</time><i className={index === 3 ? "highlight" : ""} /><div><strong>{title}</strong><span>{detail}</span></div></div>)}</div></section>; }
function DemoPrivacy() { return <section className="demo-section"><DemoHeading eyebrow="Built for responsible intelligence" title="Privacy by design" intro="RetailEye focuses on anonymous movement intelligence rather than identifying individuals by name." /><div className="privacy-layout"><div className="privacy-flow">{["Camera image", "Person detection", "Feature embedding", "Anonymous identity", "GP_000123"].map((label, index) => <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong>{index < 4 && <b>↓</b>}</div>)}</div><div className="privacy-copy"><span className="privacy-lock">⌑</span><h2>No names. No profiles.</h2><p>The demonstration uses anonymous global IDs to explain movement. Personal names, phone numbers, and personally identifying information are not part of this experience.</p><div className="privacy-points"><span>✓ Anonymous by default</span><span>✓ Movement intelligence</span><span>✓ Clear data boundaries</span></div></div></div></section>; }
function DemoAccess() { return <section className="demo-section"><DemoHeading eyebrow="Your guest account" title="Explore freely, change nothing" intro="Guest access is designed to explain the product without exposing operational controls or production data." /><div className="access-grid"><div><h2>Guest users can</h2>{["View the dashboard demo", "Understand the system architecture", "Explore sample analytics", "View simulated camera activity", "Learn multi-camera tracking"].map(item => <p key={item}><b>✓</b>{item}</p>)}</div><div className="access-denied"><h2>Guest users cannot</h2>{["Modify configuration", "Add or remove cameras", "Change detection settings", "Manage users or admin controls", "Delete data or change production settings"].map(item => <p key={item}><b>×</b>{item}</p>)}</div></div><div className="demo-security-note"><strong>Read-only by design</strong><span>The server verifies your Firebase role before allowing this demo route. UI visibility is paired with backend authorization.</span></div></section>; }
function DemoHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) { return <div className="demo-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>; }
export default function GuestDemoPage() { return <ProtectedShell><GuestDemoContent /></ProtectedShell>; }
