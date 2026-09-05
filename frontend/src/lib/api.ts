import { getIdToken } from "@/services/auth.service";

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
