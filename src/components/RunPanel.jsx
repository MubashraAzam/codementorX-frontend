import { useEffect, useState } from "react";
import { Play, RefreshCw, Eye, Keyboard, MessageCircleQuestion } from "lucide-react";
import { runCode, canVisualize } from "../runner";
import Visualizer from "./Visualizer";

/**
 * Module 4.1 — Run button, program input (stdin) and output for the editor.
 * Python, JavaScript and React run in the browser; C++/Java run on the server.
 * onError(text) lets the AI partner see the error (Module 3.2).
 */
export default function RunPanel({ language, code, onError }) {
  const [stdin, setStdin] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [previewLog, setPreviewLog] = useState([]);
  const [visualize, setVisualize] = useState(false);

  // Console output and errors from the React preview iframe.
  useEffect(() => {
    if (language !== "react") return undefined;
    const onMsg = (e) => {
      if (!e.data?.cmxPreview || e.data.kind === "ready") return;
      setPreviewLog((l) => [...l.slice(-49), { kind: e.data.kind, text: e.data.text }]);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [language]);

  async function run() {
    if (!code.trim() || running) return;
    setRunning(true);
    setPreviewLog([]);
    setResult(null);
    const r = await runCode(language, code, stdin);
    setResult(r);
    setRunning(false);
  }

  const failed = result && !result.ok;
  const firstRunPython = language === "python" && running && !result;

  return (
    <div className="bg-white rounded-2xl border border-[#ECE7F4] overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#F0EBF7]">
        <button onClick={run} disabled={running || !code.trim()} className="btn-game btn-cute text-sm py-2 px-4">
          {running ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />} {language === "react" ? "Preview" : "Run"}
        </button>
        {canVisualize(language) && (
          <button onClick={() => setVisualize(true)} disabled={!code.trim()} className="btn-game btn-secondary text-sm py-2 px-4">
            <Eye size={16} /> Visualize
          </button>
        )}
        {language !== "react" && (
          <button onClick={() => setShowInput((v) => !v)} className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 ${showInput ? "border-[#C9D6FB] bg-[#EEF3FF] text-[#4F6BD8]" : "border-[#ECE7F4] text-gray-500"}`}>
            <Keyboard size={14} /> Input
          </button>
        )}
        <span className="ml-auto text-[11px] font-bold text-gray-400">
          {result?.ms != null && !running ? `${result.ok ? "Finished" : "Stopped"} in ${(result.ms / 1000).toFixed(1)}s` : ["cpp", "java"].includes(language) ? "Runs on the server" : "Runs in your browser"}
        </span>
      </div>

      {showInput && language !== "react" && (
        <div className="p-3 border-b border-[#F0EBF7]">
          <div className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1">Program input (one value per line)</div>
          <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} maxLength={10000}
            className="w-full bg-[#FAF8FE] border-2 border-[#ECE7F4] rounded-xl px-3 py-2 font-mono text-xs text-accent focus:border-[#9B7DF0] focus:outline-none" placeholder={"Ali\n20"} />
        </div>
      )}

      {firstRunPython && <div className="p-3 text-xs font-bold text-gray-400">Starting Python in your browser… the first run takes a few seconds.</div>}

      {result?.preview && (
        <iframe title="React preview" sandbox="allow-scripts" srcDoc={result.preview} className="w-full h-72 bg-white border-b border-[#F0EBF7]" />
      )}

      {(result && !result.preview) || previewLog.length > 0 ? (
        <div className="bg-[#1E2235] text-[#E6E9F5] font-mono text-xs p-4 max-h-64 overflow-auto whitespace-pre-wrap">
          {result?.stdout}
          {previewLog.map((l, i) => <div key={i} className={l.kind === "error" ? "text-[#FF8A8A]" : ""}>{l.text}</div>)}
          {result?.stderr && <div className="text-[#FF8A8A] mt-1">{result.stderr}</div>}
          {result && !result.stdout && !result.stderr && !result.preview && <span className="text-gray-400">(no output)</span>}
        </div>
      ) : null}

      {failed && onError && (
        <div className="p-3 border-t border-[#F0EBF7]">
          <button onClick={() => onError(result.stderr)} className="text-xs font-bold text-[#8B6FE8] flex items-center gap-1.5 hover:underline">
            <MessageCircleQuestion size={14} /> Ask my AI partner about this error
          </button>
        </div>
      )}

      {visualize && <Visualizer code={code} stdin={stdin} onClose={() => setVisualize(false)} />}
    </div>
  );
}
