// Tiny syntax highlighter + markdown renderer for the level page.
// Everything is escaped first, so AI text can never inject HTML.

export function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const KEYWORDS = {
  python: "if|elif|else|and|or|not|True|False|None|for|in|while|def|return|class|import|from|as|try|except|finally|raise|with|break|continue|pass|lambda|is|global|self",
  cpp: "if|else|switch|case|default|for|while|do|break|continue|return|int|float|double|char|bool|void|string|auto|const|true|false|class|struct|public|private|protected|new|delete|using|namespace|include|template|typename|virtual|override|try|catch|throw|nullptr|std|vector|map|set",
  java: "if|else|switch|case|default|for|while|do|break|continue|return|int|float|double|char|boolean|void|String|true|false|class|public|private|protected|static|new|import|try|catch|throw|null|this|extends|implements",
  javascript: "if|else|switch|case|default|for|while|do|break|continue|return|let|const|var|function|true|false|null|undefined|class|new|import|export|from|try|catch|throw|this|of|in",
};
const BUILTINS = {
  python: "print|input|int|float|str|len|range|type|list|dict|set|tuple|open|abs|min|max|sum|round|sorted",
  cpp: "cout|cin|endl|getline|main|printf|scanf|size|push_back",
  java: "System|out|println|print|Scanner|nextInt|nextLine|main|length",
  javascript: "console|log|prompt|alert|Math|parseInt|parseFloat|length|push",
};

const reCache = {};
function tokenRe(lang) {
  if (!reCache[lang]) {
    const comment = lang === "python" ? "#.*$" : "\\/\\/.*$|#include.*$";
    reCache[lang] = new RegExp(
      `(${comment})|("(?:[^"\\\\]|\\\\.)*"?|'(?:[^'\\\\]|\\\\.)*'?)|\\b(${KEYWORDS[lang] || KEYWORDS.python})\\b|\\b(${BUILTINS[lang] || BUILTINS.python})\\b|\\b(\\d+(?:\\.\\d+)?)\\b|(>=|<=|==|!=|<<|>>|&&|\\|\\||[%+\\-*/<>=!])`,
      "g",
    );
  }
  return reCache[lang];
}

export function highlightLine(line, lang = "python") {
  const re = tokenRe(lang);
  re.lastIndex = 0;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    if (m[0] === "") {
      re.lastIndex += 1;
      continue;
    }
    out += esc(line.slice(last, m.index));
    const t = esc(m[0]);
    if (m[1]) out += `<span class="c">${t}</span>`;
    else if (m[2]) out += `<span class="s">${t}</span>`;
    else if (m[3]) out += `<span class="k">${t}</span>`;
    else if (m[4]) out += `<span class="f">${t}</span>`;
    else if (m[5]) out += `<span class="nm">${t}</span>`;
    else out += `<span class="op">${t}</span>`;
    last = re.lastIndex;
  }
  return out + esc(line.slice(last));
}

export function codeCardHTML(code, lang, label) {
  const lines = code.replace(/\n$/, "").split("\n");
  const body = lines.map((l, i) => `<span class="l" data-n="${i + 1}">${highlightLine(l, lang) || " "}</span>`).join("");
  return `<div class="code"><div class="chead"><i></i><i></i><i></i><span class="fn">${esc(label || lang)}</span></div><pre>${body}</pre></div>`;
}

function inline(s) {
  return esc(s)
    .replace(/`([^`\n]+)`/g, '<code class="in">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
}
export { inline as inlineMarkdown };

const FENCE_LANG = { py: "python", python: "python", cpp: "cpp", "c++": "cpp", c: "cpp", java: "java", js: "javascript", javascript: "javascript", jsx: "javascript" };

export function renderMarkdown(md, defaultLang = "python") {
  if (!md) return "";
  const blocks = [];
  const text = md.replace(/```([\w+#-]*)[^\n]*\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push({ lang: FENCE_LANG[(lang || "").toLowerCase()] || (lang ? "python" : defaultLang), raw: lang, code });
    return `\n@@CODE${blocks.length - 1}@@\n`;
  });
  let html = "";
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) html += `<p>${para.map(inline).join("<br>")}</p>`;
    para = [];
  };
  const flushList = () => {
    if (list) html += `<${list.type}>${list.items.map((li) => `<li>${inline(li)}</li>`).join("")}</${list.type}>`;
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const cb = line.match(/^@@CODE(\d+)@@$/);
    if (!line) {
      flushPara();
      flushList();
    } else if (cb) {
      flushPara();
      flushList();
      const b = blocks[Number(cb[1])];
      html += codeCardHTML(b.code, b.lang, b.raw || b.lang);
    } else if (/^#{1,4}\s/.test(line)) {
      flushPara();
      flushList();
      html += `<h4>${inline(line.replace(/^#{1,4}\s+/, ""))}</h4>`;
    } else if (/^([-*•]|\d+[.)])\s+/.test(line)) {
      flushPara();
      const type = /^\d/.test(line) ? "ol" : "ul";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(line.replace(/^([-*•]|\d+[.)])\s+/, ""));
    } else if (/^>\s?/.test(line)) {
      flushPara();
      flushList();
      html += `<div class="note tip"><span class="e">💡</span><span>${inline(line.replace(/^>\s?/, ""))}</span></div>`;
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return html;
}

// Splits the AI lesson into sections for the contents list.
// "## " headings are sections; when the lesson has only a few of them,
// "### " sub-headings (for example each key concept) become sections too.
export function splitSections(md) {
  if (!md) return [];
  const lines = md.replace(/\r/g, "").split("\n");
  let inFence = false;
  const h2 = lines.filter((l) => {
    if (/^\s*```/.test(l)) inFence = !inFence;
    return !inFence && /^##\s/.test(l);
  }).length;
  const heading = h2 >= 5 ? /^(##)\s+(.*)/ : h2 > 0 ? /^(###?)\s+(.*)/ : /^(#{1,3})\s+(.*)/;
  const out = [];
  let cur = null;
  inFence = false;
  for (const l of lines) {
    if (/^\s*```/.test(l)) inFence = !inFence;
    const m = !inFence && l.match(heading);
    if (m) {
      cur = { title: m[2].replace(/[*#`]/g, "").trim(), sub: m[1] === "###", body: [] };
      out.push(cur);
    } else {
      if (!cur) {
        if (!l.trim() || /^#\s/.test(l)) continue;
        cur = { title: "Introduction", sub: false, body: [] };
        out.push(cur);
      }
      cur.body.push(l);
    }
  }
  return out.map((s) => ({ title: s.title, sub: s.sub, body: s.body.join("\n").trim() })).filter((s) => s.body || s.title);
}

// Backup lesson cards built from the full lesson text, used when the server's
// /api/mentor/overview is not available (old backend still deployed, or the AI
// is busy). No AI call is needed.
export function overviewFromLesson(md, level) {
  const sections = splitSections(md);
  if (!sections.length) return null;
  const find = (re) => sections.find((s) => re.test(s.title));
  const firstPara = (body) => (body || "").split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !/^(```|[-*•]|\d+[.)]|#)/.test(p)) || "";
  const bullets = (body) => (body || "").split("\n").map((l) => l.trim()).filter((l) => /^([-*•]|\d+[.)])\s+/.test(l)).map((l) => l.replace(/^([-*•]|\d+[.)])\s+/, ""));
  const intro = find(/intro|overview|why/i) || sections[0];
  const mistakes = find(/mistake|pitfall|error/i);
  const summary = find(/summary|recap|key takeaway/i);
  const concepts = sections.filter((s) => s !== intro && s !== mistakes && s !== summary && !/^key concepts$/i.test(s.title));
  const codeOf = (body) => ((body || "").match(/```[\w+#-]*\n([\s\S]*?)```/) || [])[1] || "";
  const topics = (level?.sub || "").split("·").map((t) => t.trim()).filter(Boolean);
  const m = bullets(mistakes?.body)[0] || "";
  return {
    bigIdea: firstPara(intro.body).split("\n```")[0].slice(0, 500) || `In this level you learn **${level?.title || "this topic"}**.`,
    flow: {
      type: "steps",
      title: "What this lesson covers",
      steps: (concepts.length ? concepts : sections).slice(0, 5).map((s) => ({ label: s.title, detail: firstPara(s.body).split("\n")[0].replace(/[*`]/g, "").slice(0, 60) })),
    },
    cards: topics.slice(0, 6).map((t) => ({ front: t.split(" ")[0], label: t, back: `See "${t}" in the full lesson` })),
    mistake: { title: m ? m.replace(/[*`]/g, "").split(/[.:]/)[0].slice(0, 60) : "Read errors slowly", text: m || "Most beginner errors are a missing symbol or wrong indentation. Read the error's line number first.", wrong: "", right: "" },
    recap: (bullets(summary?.body).length ? bullets(summary.body) : topics.map((t) => `I can use ${t}`)).slice(0, 4),
    example: { file: "main", code: concepts.map((s) => codeOf(s.body)).find(Boolean) || codeOf(md), inputs: [] },
    fromLesson: true,
  };
}

export function plainText(md) {
  return (md || "").replace(/```[\s\S]*?```/g, " ").replace(/[#*`>]/g, "").replace(/\s+/g, " ").trim();
}
