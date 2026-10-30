import { transform } from "sucrase";

// Module 4.1 — builds a sandboxed preview page for React code. The student's
// component is compiled from JSX in the browser (sucrase) and rendered inside
// an <iframe sandbox="allow-scripts">, which cannot touch the main app.
const CDN = (import.meta.env.VITE_CDN_BASE || "https://unpkg.com").replace(/\/$/, "");

function prepare(code) {
  let src = code
    // imports from react / react-dom become globals from the UMD build
    .replace(/^\s*import\s+React\s*,\s*\{([^}]*)\}\s*from\s*["']react["'];?/gm, "const {$1} = React;")
    .replace(/^\s*import\s*\{([^}]*)\}\s*from\s*["']react["'];?/gm, "const {$1} = React;")
    .replace(/^\s*import\s+React\s+from\s*["']react["'];?/gm, "")
    .replace(/^\s*import\s+(\*\s+as\s+)?\w+\s+from\s*["']react-dom(\/client)?["'];?/gm, "")
    .replace(/^\s*import\s+["'][^"']+\.css["'];?/gm, "")
    .replace(/^\s*export\s+default\s+function\s+(\w+)/m, "window.__cmxDefault = $1;\nfunction $1")
    .replace(/^\s*export\s+default\s+(\w+)\s*;?\s*$/m, "window.__cmxDefault = $1;")
    .replace(/^\s*export\s+default\s+/m, "window.__cmxDefault = ")
    .replace(/^\s*export\s+(?=(function|const|let|class)\b)/gm, "");
  const leftover = src.match(/^\s*import\s.+$/m);
  if (leftover) throw new Error(`Only imports from "react" work in the preview. Remove: ${leftover[0].trim()}`);
  return transform(src, { transforms: ["jsx", "typescript"], jsxRuntime: "classic", production: true }).code;
}

export function buildReactPreview(code) {
  const compiled = prepare(code)
    // the default export line moved before the function; hoisting makes that fine
    .replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8">
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#14325D}</style>
<script src="${CDN}/react@18.3.1/umd/react.development.js"></script>
<script src="${CDN}/react-dom@18.3.1/umd/react-dom.development.js"></script>
</head><body><div id="root"></div>
<script>
const send = (kind, text) => parent.postMessage({ cmxPreview: true, kind, text: String(text) }, "*");
["log","info","warn","error"].forEach(k => { const o = console[k]; console[k] = (...a) => { send(k === "error" ? "error" : "log", a.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" ")); o.apply(console, a); }; });
window.addEventListener("error", e => send("error", e.message));
try {
${compiled}
  const Root = window.__cmxDefault || (typeof App !== "undefined" ? App : null);
  if (!Root) throw new Error("Export a component (export default function App) to see the preview.");
  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Root));
  send("ready", "rendered");
} catch (e) { send("error", e.message); }
</script></body></html>`;
}
