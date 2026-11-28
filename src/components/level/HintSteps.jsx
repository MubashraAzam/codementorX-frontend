import { useState } from "react";
import { Dots, Icon, Md } from "./ui";

/**
 * Module 3.3 — the Socratic hint ladder in the new design.
 * Hint 1 is a nudge, hint 2 is more specific, hint 3 walks through the
 * approach. The server never gives the final answer here.
 * fetchHint(step) must return the hint text for step 1, 2 or 3.
 */
export default function HintSteps({ fetchHint, lang, disabled = false, onUsed }) {
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const next = hints.length + 1;

  async function more() {
    if (loading || next > 3) return;
    setLoading(true);
    setError("");
    try {
      const text = await fetchHint(next);
      setHints((h) => [...h, text]);
      onUsed?.();
    } catch (err) {
      setError(err.message || "Could not get a hint.");
    }
    setLoading(false);
  }

  return (
    <div className="hintsteps">
      <button type="button" className="btn gh sm" onClick={more} disabled={disabled || loading || next > 3}>
        <Icon name="bulb" />
        {next > 3 ? "All 3 hints used" : hints.length === 0 ? "Hint (1 of 3)" : `Next hint (${next} of 3)`}
      </button>
      {loading && <Dots label="Thinking of a hint…" />}
      {error && <div className="errbox">{error}</div>}
      {hints.map((h, i) => (
        <div key={i} className="hintbox show">
          <b>Hint {i + 1} of 3</b>
          <Md text={h} lang={lang} />
        </div>
      ))}
    </div>
  );
}
