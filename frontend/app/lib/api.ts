import axios from "axios";

// Uses the NEXT_PUBLIC_API_URL already defined in .env.local
const BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";


const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

export function formatApiError(detail: unknown): string {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return (detail as Array<{ msg?: string }>)
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail === "object" && "msg" in detail && typeof (detail as { msg: string }).msg === "string")
    return (detail as { msg: string }).msg;
  return String(detail);
}

export default api;
