"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };
const prompts = ["How do I create a payment?", "How can I reduce chargebacks?", "What is my payment volume?"];

export function AIAssistantPanel() {
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(message = input) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const result = await apiRequest<{ answer: string }>("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: trimmed, page: pathname, page_title: pathname === "/dashboard" ? "Risk Center" : pathname.slice(1).replaceAll("-", " "), history: nextMessages.slice(-12) }) });
      setMessages([...nextMessages, { role: "assistant", content: result.answer }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The AI assistant is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return <aside className="ai-assistant glass-primary"><div className="assistant-heading"><span className="assistant-spark">✦</span><div><h2>AI Assistant</h2><p>Grounded in this workspace.</p></div><span className={`assistant-status ${error ? "assistant-status-error" : ""}`}>{loading ? "Connecting" : error ? "Unavailable" : "Ready"}</span></div><div className="assistant-welcome"><span className="assistant-orb" aria-hidden="true">AI</span><span className="section-eyebrow">Current page</span><h3>{pathname === "/dashboard" ? "Welcome to your Risk Center." : `You are viewing ${pathname.slice(1).replaceAll("-", " ")}.`}</h3><p>Ask about your authorized workspace data or how to use the product. Answers never invent payment activity.</p></div>{messages.length > 0 && <div className="assistant-messages" aria-live="polite">{messages.map((message, index) => <p className={`assistant-message assistant-message-${message.role}`} key={`${message.role}-${index}`}>{message.content}</p>)}{loading && <p className="assistant-message assistant-message-assistant">Thinking...</p>}</div>}{messages.length === 0 && <div className="assistant-prompts"><span>Try a question</span>{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}</button>)}</div>}{error && <p className="assistant-error" role="alert">{error}</p>}<form className="assistant-input" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}><input value={input} onChange={(event) => setInput(event.target.value)} disabled={loading} placeholder="Ask anything..." aria-label="Ask the AI assistant" /><button disabled={loading || !input.trim()} type="submit" aria-label="Send question">↑</button></form></aside>;
}
