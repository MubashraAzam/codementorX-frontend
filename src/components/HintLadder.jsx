import { useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { formatAIMarkdown } from "../utils/aiMarkdown";

/**
 * Module 3.3 — Socratic hint ladder.
 * Hint 1 is a nudge, hint 2 is more specific, hint 3 walks through the
 * approach. The final answer is never given here.
 *
 * fetchHint(step) must return the hint text for step 1, 2 or 3.
 */
export default function HintLadder({ fetchHint, disabled = false, compact = false }) {
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
    } catch (err) {
      setError(err.message || "Could not get a hint.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={`btn-game btn-secondary ${compact ? "text-sm py-2 px-4" : ""}`}
        onClick={more}
        disabled={disabled || loading || next > 3}
      >
        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Lightbulb size={16} />}
        {next > 3 ? "All 3 hints used" : hints.length === 0 ? "Hint (1 of 3)" : `Next hint (${next} of 3)`}
      </button>
      {error && <div className="text-sm text-red-600 font-medium">{error}</div>}
      {hints.map((h, i) => (
        <div key={i} className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4">
          <div className="text-warning font-heading font-bold mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Lightbulb size={14} /> Hint {i + 1} of 3
          </div>
          <div className="text-sm text-accent/80 font-medium" dangerouslySetInnerHTML={{ __html: formatAIMarkdown(h) }} />
        </div>
      ))}
    </div>
  );
}
