export const cn = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

// Backend origin (strip the /api/v1 suffix) so we can resolve relative /media URLs.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

export const mediaUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BACKEND_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const fmtNum = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: digits });

export const fmtKg = (n: number | null | undefined) =>
  n == null ? "—" : `${fmtNum(n, 1)} kg`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const timeAgo = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(iso);
};
