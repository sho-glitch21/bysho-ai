import { j as F, C as L, al as E, f$ as j, aZ as B, dz as G, aj as R, aD as x, as as S, bQ as X, eW as C } from "./three.module-uK51GCjZ.js";
const M = document.querySelector("#signature-field"), P = window.matchMedia("(prefers-reduced-motion: reduce)").matches, f = () => window.matchMedia("(max-width: 760px)").matches, d = { x: 0, y: 0, targetX: 0, targetY: 0 };
function k(n = 20903) {
  let e = n >>> 0;
  return () => (e ^= e << 13, e ^= e >>> 17, e ^= e << 5, (e >>> 0) / 4294967296);
}
const l = k(), y = new F();
y.background = new L("#030304");
const u = new E(43, innerWidth / innerHeight, 0.1, 100);
u.position.set(0, 0, 10.3);
u.lookAt(0, 0, 0);
let r, m, v = 0;
function Y() {
  const n = f() ? 32e3 : 104e3, e = new Float32Array(n * 3), o = new Float32Array(n * 3), t = 2.8, h = 1.78;
  for (let g = 0; g < n; g++) {
    const a = l() * Math.PI * 2, w = (l() * 2 - 1) * h, A = w * (0.96 + 0.05 * Math.sin(3 * a + w * 1.6)), H = 0.19 * Math.sin(3 * a + w * 2.3) + 0.11 * Math.sin(7 * a - w * 1.4), W = t + A * Math.cos(a * 0.5) + H, z = (l() - 0.5) * 0.085, p = g * 3;
    e[p] = W * Math.cos(a) + z * Math.cos(a + 0.4), e[p + 1] = (W * Math.sin(a) + z * Math.sin(a)) * 0.82, e[p + 2] = A * Math.sin(a * 0.5) + 0.22 * Math.sin(3 * a + w) + (l() - 0.5) * 0.12;
    const b = 0.18 + Math.pow(l(), 1.65) * 0.8;
    o[p] = b * 0.79, o[p + 1] = b * 0.83, o[p + 2] = b * (0.92 + l() * 0.08);
  }
  const s = new R();
  s.setAttribute("position", new x(e, 3)), s.setAttribute("color", new x(o, 3)), s.computeBoundingSphere();
  const i = new S({ size: f() ? 0.022 : 0.019, vertexColors: true, transparent: true, opacity: 0.93, sizeAttenuation: true, depthWrite: false, blending: X }), c = new C(s, i);
  return c.rotation.set(0.62, 0.13, -0.2), c.position.set(f() ? 0 : -0.25, 0.02, 0), c.scale.setScalar(f() ? 0.88 : 1), y.add(c), c;
}
function T() {
  const n = f() ? 700 : 2200, e = new Float32Array(n * 3), o = new Float32Array(n * 3);
  for (let h = 0; h < n; h++) {
    const s = h * 3;
    e[s] = (l() - 0.5) * 25, e[s + 1] = (l() - 0.5) * 15, e[s + 2] = -3 - l() * 14;
    const i = 0.16 + l() * 0.18;
    o[s] = i * 0.76, o[s + 1] = i * 0.82, o[s + 2] = i;
  }
  const t = new R();
  t.setAttribute("position", new x(e, 3)), t.setAttribute("color", new x(o, 3)), y.add(new C(t, new S({ size: 0.014, vertexColors: true, transparent: true, opacity: 0.38, sizeAttenuation: true, depthWrite: false })));
}
function q() {
  document.documentElement.classList.add("field-fallback");
  const n = M.getContext("2d");
  if (!n) return;
  const e = f() ? 1e4 : 24e3, o = [], t = k(5329233), h = () => {
    const i = Math.min(devicePixelRatio || 1, 1.5);
    M.width = Math.floor(innerWidth * i), M.height = Math.floor(innerHeight * i), M.style.width = innerWidth + "px", M.style.height = innerHeight + "px", n.setTransform(i, 0, 0, i, 0, 0);
  };
  h();
  for (let i = 0; i < e; i++) {
    const c = t() * Math.PI * 2, g = (t() * 2 - 1) * 1.7, a = 0.38 + 0.14 * Math.sin(3 * c);
    o.push({ x: 0.5 + a * Math.cos(c) * 0.105 + g * Math.cos(c / 2) * Math.cos(c) * 0.035, y: 0.5 + a * Math.sin(c) * 0.19, a: 0.16 + t() * 0.78, s: t() < 0.94 ? 0.55 : 1.25 });
  }
  const s = () => {
    n.clearRect(0, 0, innerWidth, innerHeight);
    for (const i of o) n.fillStyle = "rgba(210,216,245," + i.a + ")", n.fillRect(i.x * innerWidth, i.y * innerHeight, i.s, i.s);
  };
  addEventListener("resize", () => {
    h(), s();
  }, { passive: true }), s();
}
try {
  r = new j({ canvas: M, antialias: true, alpha: false, powerPreference: "high-performance" }), r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)), r.setSize(innerWidth, innerHeight, false), r.outputColorSpace = B, r.setClearColor("#030304", 1), m = Y(), T();
  const n = () => {
    const t = f();
    u.aspect = innerWidth / innerHeight, u.position.z = t ? 12.4 : 10.3, u.fov = t ? 47 : 43, u.updateProjectionMatrix(), r.setPixelRatio(Math.min(devicePixelRatio || 1, t ? 1.25 : 1.5)), r.setSize(innerWidth, innerHeight, false), m.scale.setScalar(t ? 0.88 : 1), m.position.x = t ? 0 : -0.25;
  };
  addEventListener("resize", n, { passive: true }), addEventListener("pointermove", (t) => {
    P || (d.targetX = (t.clientX / innerWidth - 0.5) * 2, d.targetY = (t.clientY / innerHeight - 0.5) * 2);
  }, { passive: true });
  const e = new G(), o = () => {
    const t = e.getElapsedTime();
    P || (d.x += (d.targetX - d.x) * 0.025, d.y += (d.targetY - d.y) * 0.025, m.rotation.y = 0.13 + d.x * 0.12 + Math.sin(t * 0.12) * 0.035, m.rotation.x = 0.62 + d.y * 0.09 + Math.cos(t * 0.09) * 0.018, m.rotation.z = -0.2 + Math.sin(t * 0.075) * 0.025), r.render(y, u), v = requestAnimationFrame(o);
  };
  o();
} catch (n) {
  console.warn("The Signature WebGL field could not start; using the static fallback.", n), r && r.dispose(), q();
}
addEventListener("pagehide", () => {
  v && cancelAnimationFrame(v), r && r.dispose();
}, { once: true });
