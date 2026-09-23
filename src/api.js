// Production API root (must end with /api — paths below are relative to it)
const DEFAULT_API_BASE = "https://calculator-backend-jwj5.onrender.com/api";

function normalizeApiBase(url) {
  let base = (url || DEFAULT_API_BASE).trim().replace(/\/$/, "");
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return base;
}

const BASE = normalizeApiBase(import.meta.env.VITE_API_URL);

async function request(path, options = {}) {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch (err) {
    throw new Error(err?.message || "Failed to fetch");
  }

  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.success === false) {
    throw new Error(
      json?.data?.message || json?.message || res.statusText || "Request failed"
    );
  }

  return json?.data ?? json;
}

export const calculate = (expression) =>
  request("/calculate/", {
    method: "POST",
    body: JSON.stringify({ expression }),
  });

export const getHistory = () => request("/history/");

export const getHistoryItem = (id) => request(`/history/${id}/`);

export const deleteHistoryItem = (id) =>
  request(`/history/${id}/`, { method: "DELETE" });

export const clearHistory = () =>
  request("/history/clear/", { method: "DELETE" });
