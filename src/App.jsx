import { useEffect, useState } from "react";
import {
  calculate,
  getHistory,
  deleteHistoryItem,
  clearHistory,
} from "./api";
import "./App.css";

const BUTTONS = [
  ["C", "⌫", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

const OPS = new Set(["+", "−", "×", "÷", "%"]);

function toApiExpression(display) {
  return display
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-");
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function App() {
  const [display, setDisplay] = useState("0");
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    try {
      const data = await getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load history");
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleEquals() {
    const expression = toApiExpression(display).trim();
    if (!expression || expression === "0") return;

    setLoading(true);
    setError("");
    try {
      const data = await calculate(expression);
      setDisplay(String(data.result));
      setJustEvaluated(true);
      await loadHistory();
    } catch (e) {
      setError(e.message || "Calculation failed");
    } finally {
      setLoading(false);
    }
  }

  function press(key) {
    setError("");

    if (key === "C") {
      setDisplay("0");
      setJustEvaluated(false);
      return;
    }

    if (key === "⌫") {
      setDisplay((d) => (d.length <= 1 ? "0" : d.slice(0, -1)));
      setJustEvaluated(false);
      return;
    }

    if (key === "=") {
      handleEquals();
      return;
    }

    setDisplay((prev) => {
      if (justEvaluated) {
        setJustEvaluated(false);
        if (OPS.has(key)) return prev + " " + key + " ";
        return key === "." ? "0." : key;
      }

      if (prev === "0" && key !== ".") {
        if (OPS.has(key)) return prev + " " + key + " ";
        return key;
      }

      if (OPS.has(key)) {
        const trimmed = prev.trimEnd();
        const last = trimmed.slice(-1);
        if (OPS.has(last) || ["+", "-", "*", "/"].includes(last)) {
          return trimmed.slice(0, -1).trimEnd() + " " + key + " ";
        }
        return trimmed + " " + key + " ";
      }

      if (key === ".") {
        const parts = prev.split(/ [+\-−×÷%] /);
        const lastNum = parts[parts.length - 1] ?? "";
        if (lastNum.includes(".")) return prev;
      }

      return prev + key;
    });
  }

  async function onDelete(id) {
    setError("");
    try {
      await deleteHistoryItem(id);
      setHistory((items) => items.filter((item) => item.id !== id));
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  }

  async function onClear() {
    setError("");
    try {
      await clearHistory();
      setHistory([]);
    } catch (e) {
      setError(e.message || "Clear failed");
    }
  }

  function reuseItem(item) {
    setDisplay(item.expression);
    setJustEvaluated(false);
    setError("");
  }

  return (
    <div className="page">
      <div className="glow" aria-hidden="true" />

      <header className="brand">
        <p className="brand-name">CalcLab</p>
        <p className="brand-tag">Expression calculator with live history</p>
      </header>

      <div className="layout">
        <main className="calculator" aria-label="Calculator">
          <div className="screen">
            <div className="expression" title={display}>
              {display}
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="pad">
            {BUTTONS.flat().map((key) => (
              <button
                key={key}
                type="button"
                className={[
                  "key",
                  key === "0" ? "wide" : "",
                  key === "=" ? "equals" : "",
                  OPS.has(key) || key === "C" || key === "⌫" ? "muted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => press(key)}
                disabled={loading && key === "="}
              >
                {loading && key === "=" ? "…" : key}
              </button>
            ))}
          </div>
        </main>

        <aside className="history" aria-label="Calculation history">
          <div className="history-head">
            <h2>History</h2>
            <button
              type="button"
              className="text-btn"
              onClick={onClear}
              disabled={!history.length}
            >
              Clear all
            </button>
          </div>

          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="history-item"
                  onClick={() => reuseItem(item)}
                >
                  <span className="hist-expr">{item.expression}</span>
                  <strong className="hist-result">= {item.result}</strong>
                  <time className="hist-time" dateTime={item.created_at}>
                    {formatTime(item.created_at)}
                  </time>
                </button>
                <button
                  type="button"
                  className="delete"
                  aria-label={`Delete ${item.expression}`}
                  onClick={() => onDelete(item.id)}
                >
                  ×
                </button>
              </li>
            ))}
            {!history.length && (
              <li className="empty">No calculations yet</li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
