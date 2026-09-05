"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { streamApiRequest } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; sources?: { type: string; id: string }[] };

export function AIAssistantPanel() {
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<"idle" | "thinking" | "streaming" | "error">("idle");
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [sources, setSources] = useState<{ type: string; id: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const prompts = pathname.startsWith("/transactions") ? ["Why was this transaction flagged?", "What are the strongest risk signals?", "Show my latest risk events."] : ["What is my payment volume?", "What caused the biggest risk increase?", "How can I reduce chargebacks?"];
  const pageTitle = pathname === "/dashboard" ? "Risk Overview" : pathname.slice(1).replaceAll("-", " ");

  useEffect(() => () => abortRef.current?.abort(), []);

  async function sendMessage(message = input) {
    const trimmed = message.trim();
    if (!trimmed || state === "thinking" || state === "streaming") return;
    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setState("thinking");
    const assistantIndex = nextMessages.length;
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamApiRequest("/api/ai/chat", { message: trimmed, page: pathname, page_title: pageTitle, history: nextMessages.slice(-12), conversation_id: conversationId, entity_type: pathname.startsWith("/transactions/") ? "transaction" : undefined, entity_id: pathname.startsWith("/transactions/") ? pathname.split("/")[2] : undefined }, controller.signal, (event) => {
        if (event.type === "meta") { setConversationId(event.conversation_id); setSources(event.sources ?? []); setState("streaming"); }
        if (event.type === "delta") setMessages((current) => current.map((item, index) => index === assistantIndex ? { ...item, content: item.content + (event.content ?? "") } : item));
        if (event.type === "done") setState("idle");
        if (event.type === "error") { setError(event.message ?? "The AI assistant is unavailable."); setState("error"); }
      });
    } catch (requestError) {
      if ((requestError as Error).name !== "AbortError") { setError(requestError instanceof Error ? requestError.message : "The AI assistant is unavailable."); setState("error"); }
    } finally {
      abortRef.current = null;
    }
  }

  const busy = state === "thinking" || state === "streaming";
  return <aside className="ai-assistant glass-primary"><div className="assistant-heading"><span className="assistant-spark">✦</span><div><h2>AI Risk Copilot</h2><p>Grounded in this workspace.</p></div><span className={`assistant-status ${error ? "assistant-status-error" : ""}`}>{state === "thinking" ? "Retrieving" : state === "streaming" ? "Generating" : error ? "Offline" : "Ready"}</span></div><div className="assistant-welcome"><span className="assistant-orb" aria-hidden="true">AI</span><span className="section-eyebrow">Current page</span><h3>{pathname === "/dashboard" ? "Risk Overview" : `Viewing ${pageTitle}.`}</h3><p>Ask about authorized workspace data. Verified facts are retrieved from your backend.</p></div>{messages.length > 0 && <div className="assistant-messages" aria-live="polite">{messages.map((message, index) => <div className={`assistant-message assistant-message-${message.role}`} key={`${message.role}-${index}`}><p>{message.content || (busy && index === messages.length - 1 ? "Analyzing..." : "")}</p>{message.sources?.length ? <small>Sources: {message.sources.map((source) => `${source.type} ${source.id}`).join(", ")}</small> : null}</div>)}</div>}{messages.length === 0 && <div className="assistant-prompts"><span>Try a question</span>{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}</button>)}</div>}{sources.length > 0 && <p className="assistant-sources">Sources: {sources.map((source) => `${source.type} ${source.id}`).join(", ")}</p>}{error && <div className="assistant-error" role="alert"><span>{error}</span><button type="button" onClick={() => { setError(""); void sendMessage(messages.at(-2)?.content ?? ""); }}>Retry</button></div>}<form className="assistant-input" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}><input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="Ask anything..." aria-label="Ask the AI assistant" /><button disabled={busy || !input.trim()} type="submit" aria-label="Send question">↑</button>{busy && <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop generating">■</button>}</form></aside>;
}
