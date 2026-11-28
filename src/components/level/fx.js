// Small visual effects (sparks, "+10 XP" float, confetti).
// They draw straight into the page root, outside React, and clean up after themselves.

const COLORS = ["#FF6FA5", "#FFA36C", "#F5B83D", "#4BE39A", "#8FD3FF", "#A3245A"];

function reduced() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function sparks(root, el) {
  if (!root || !el || reduced()) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 18; i += 1) {
    const s = document.createElement("i");
    s.className = "spark";
    const a = Math.random() * Math.PI * 2;
    const d = 40 + Math.random() * 60;
    s.style.left = `${r.left + r.width / 2}px`;
    s.style.top = `${r.top + r.height / 2}px`;
    s.style.background = COLORS[i % 4];
    s.style.setProperty("--x", `${Math.cos(a) * d}px`);
    s.style.setProperty("--y", `${Math.sin(a) * d}px`);
    root.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

export function floatXP(root, el, text) {
  if (!root || !el) return;
  const r = el.getBoundingClientRect();
  const x = document.createElement("div");
  x.className = "xpf";
  x.textContent = text;
  x.style.left = `${r.left + r.width / 2}px`;
  x.style.top = `${r.top - 10}px`;
  root.appendChild(x);
  setTimeout(() => x.remove(), 1300);
}

export function confetti(canvas) {
  if (!canvas || reduced()) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const P = Array.from({ length: 170 }, () => ({
    x: window.innerWidth / 2 - 160 + (Math.random() - 0.5) * 300,
    y: window.innerHeight / 2 - 60,
    vx: (Math.random() - 0.5) * 18,
    vy: -Math.random() * 16 - 4,
    r: Math.random() * 6.28,
    s: 5 + Math.random() * 7,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  let f = 0;
  const loop = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    P.forEach((p) => {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += 0.15;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    f += 1;
    if (f < 170) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  requestAnimationFrame(loop);
}

// Smooth scroll of the page root to a position (easeInOutCubic).
export function glide(root, to, ms = 900) {
  if (!root) return;
  if (reduced()) {
    root.scrollTo(0, to);
    return;
  }
  const from = root.scrollTop;
  let start;
  const step = (t) => {
    if (start === undefined) start = t;
    const p = Math.min(1, (t - start) / ms);
    const k = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    root.scrollTo(0, from + (to - from) * k);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
