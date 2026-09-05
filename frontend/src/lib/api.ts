import { getIdToken, signOut } from "@/services/auth.service";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  if (!token) throw new Error("Your secure session is unavailable. Please sign in again.");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Unable to reach the API at ${apiUrl}. Check that the backend is running and CORS allows this frontend.`);
  }
  if (!response.ok) {
    if (response.status === 401) {
      await signOut().catch(() => undefined);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.replace("/login");
      throw new Error("Your session has expired. Please sign in again.");
    }
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json() as { detail?: string; error?: { message?: string } };
      message = body.error?.message ?? body.detail ?? message;
    } catch {
      // Preserve the HTTP status when the server does not return JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function streamApiRequest(path: string, body: unknown, signal: AbortSignal, onEvent: (event: { type: string; content?: string; conversation_id?: string; sources?: { type: string; id: string }[]; message?: string }) => void): Promise<void> {
  const token = await getIdToken();
  if (!token) throw new Error("Your secure session is unavailable. Please sign in again.");
  const response = await fetch(`${apiUrl}${path}`, { method: "POST", signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) {
    if (response.status === 401) {
      await signOut().catch(() => undefined);
      if (typeof window !== "undefined") window.location.replace("/login");
    }
    throw new Error(`AI request failed with status ${response.status}`);
  }
  if (!response.body) throw new Error("The AI service returned no stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((part) => part.startsWith("data: "));
      if (line) onEvent(JSON.parse(line.slice(6)));
    }
    if (done) break;
  }
}
