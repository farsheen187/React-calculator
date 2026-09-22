const BASE = import.meta.env.VITE_API_URL ?? "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

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
  request("/api/calculate/", {
    method: "POST",
    body: JSON.stringify({ expression }),
  });

export const getHistory = () => request("/api/history/");

export const getHistoryItem = (id) => request(`/api/history/${id}/`);

export const deleteHistoryItem = (id) =>
  request(`/api/history/${id}/`, { method: "DELETE" });

export const clearHistory = () =>
  request("/api/history/clear/", { method: "DELETE" });
