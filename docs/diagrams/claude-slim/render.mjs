#!/usr/bin/env node
// Renders the claude-slim blog diagrams.
//
//   node docs/diagrams/claude-slim/render.mjs
//
// Writes hand-authored SVG sources next to this file and rasterises them with
// sharp at 2x (3200x1800 for the 1600x900 canvas) into the blog's public assets.

import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const SVG_DIR = HERE;
const PNG_DIR = join(REPO, 'public/assets/claude-slim-orchestrator-for-claude-code');

const W = 1600;
const H = 900;
const DENSITY = 144; // 72 dpi base * 2

// ---------------------------------------------------------------- palette
const C = {
  bg: '#0f1724',
  panel: '#0b1322',
  ink: '#ffffff',
  body: '#cbd5e1',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  blue: '#60a5fa',
  purple: '#c084fc',
  amber: '#fbbf24',
  teal: '#2dd4bf',
  red: '#fb7146',
  green: '#4ade80',
};

const SANS = "'Inter','Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono','SF Mono',Menlo,monospace";

// ---------------------------------------------------------------- primitives
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Text inside `backticks` renders as bold monospace in white.
function rich(str) {
  return str
    .split(/(`[^`]+`)/)
    .filter((seg) => seg.length > 0)
    .map((seg) =>
      seg.length > 2 && seg.startsWith('`') && seg.endsWith('`')
        ? `<tspan font-family="${MONO}" font-weight="700" fill="${C.ink}">${esc(seg.slice(1, -1))}</tspan>`
        : `<tspan>${esc(seg)}</tspan>`,
    )
    .join('');
}

function t(x, y, str, o = {}) {
  const {
    size = 22,
    weight = 400,
    fill = C.body,
    anchor = 'start',
    family = SANS,
    ls = 0,
    italic = false,
    opacity,
  } = o;
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${family}"`,
    `font-size="${size}"`,
    `font-weight="${weight}"`,
    `fill="${fill}"`,
    `text-anchor="${anchor}"`,
    ls ? `letter-spacing="${ls}"` : '',
    italic ? 'font-style="italic"' : '',
    opacity != null ? `fill-opacity="${opacity}"` : '',
  ].filter(Boolean);
  return `<text xml:space="preserve" ${attrs.join(' ')}>${rich(String(str))}</text>`;
}

// Rounded card: dark base, tinted fill, 2px accent stroke with a soft glow.
function panel({ x, y, w, h, color, dashed = false, glow = true, op = 0.12, r = 18 }) {
  const d = dashed ? ' stroke-dasharray="12 8"' : '';
  return [
    glow
      ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-opacity="0.45" filter="url(#glow)"${d}/>`
      : '',
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${C.panel}"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}" fill-opacity="${op}"/>`,
    `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${r - 1}" fill="none" stroke="${color}" stroke-width="2"${d}/>`,
  ]
    .filter(Boolean)
    .join('\n');
}

// Simple line icons drawn on a 24-unit grid.
const ICONS = {
  magnifier:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 L21 21"/>',
  book:
    '<path d="M12 6.5 C9.5 4.8 6.5 4.5 3 5 V19.5 C6.5 19 9.5 19.3 12 21 C14.5 19.3 17.5 19 21 19.5 V5 C17.5 4.5 14.5 4.8 12 6.5 Z"/><path d="M12 6.5 V21"/>',
  wrench:
    '<path d="M14.5 4.5 a4.5 4.5 0 0 0 -4.3 6.1 L4 17.8 a2 2 0 0 0 2.8 2.8 L13.1 13.4 a4.5 4.5 0 0 0 6.1 -4.3 L17 11.2 L14.6 10.6 L13.9 8.2 Z"/>',
  pen:
    '<path d="M4 20 L8.5 19 L19 8.5 a2.1 2.1 0 0 0 -3 -3 L5.5 16 Z"/><path d="M14 7 L17 10"/>',
  eye:
    '<path d="M2 12 C5 6.5 19 6.5 22 12 C19 17.5 5 17.5 2 12 Z"/><circle cx="12" cy="12" r="3"/>',
  bulb:
    '<path d="M9 17.5 C7 16 6 14 6 11.5 A6 6 0 0 1 18 11.5 C18 14 17 16 15 17.5 Z"/><path d="M9.5 21 H14.5"/>',
  gear:
    '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="9" stroke-dasharray="2.6 2.4" stroke-width="2.2"/>',
  file:
    '<path d="M6 2.5 H14 L19 7.5 V21.5 H6 Z"/><path d="M14 2.5 V7.5 H19"/>',
  terminal:
    '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M6.5 9 L10 12 L6.5 15"/><path d="M12.5 15.5 H17.5"/>',
  hub:
    '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="2"/><circle cx="20" cy="12" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="20" r="2"/><path d="M12 9 V6 M15 12 H18 M9 12 H6 M12 15 V18"/>',
  person:
    '<circle cx="12" cy="8" r="4"/><path d="M4.5 21 V19 A6 6 0 0 1 10.5 13 H13.5 A6 6 0 0 1 19.5 19 V21"/>',
  scales:
    '<path d="M12 4 V20"/><path d="M8 20.5 H16"/><path d="M3.5 7.5 H20.5"/><path d="M3.5 7.5 L1.5 13 H5.5 Z"/><path d="M20.5 7.5 L18.5 13 H22.5 Z"/>',
  question:
    '<circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3 A2.9 2.9 0 1 1 13 12.1 C12.3 12.4 12 12.9 12 13.8 V14.2"/><path d="M12 17.2 V17.6"/>',
};

function icon(name, x, y, size, color) {
  const k = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;
}

// Arrows: curved links, colour taken from the card the arrow leaves or enters.
function link(x1, y1, x2, y2) {
  const m = (x1 + x2) / 2;
  return `M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`;
}
function vlink(x1, y1, x2, y2) {
  const m = (y1 + y2) / 2;
  return `M${x1} ${y1} C${x1} ${m} ${x2} ${m} ${x2} ${y2}`;
}
function arrow(d, color, { dashed = false, w = 3 } = {}) {
  const dash = dashed ? ' stroke-dasharray="7 6"' : '';
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash} marker-end="url(#arr-${color.slice(1)})"/>`;
}

function markerDefs() {
  return Object.values(C)
    .filter((c) => c !== C.bg && c !== C.panel && c !== C.ink && c !== C.body)
    .map(
      (c) =>
        `<marker id="arr-${c.slice(1)}" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,1 L15,8 L0,15 Z" fill="${c}"/></marker>`,
    )
    .join('');
}

function svgDoc(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0 H0 V40" fill="none" stroke="#60a5fa" stroke-opacity="0.08" stroke-width="1"/>
  </pattern>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="4"/>
  </filter>
  ${markerDefs()}
</defs>
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect width="${W}" height="${H}" fill="url(#grid)"/>
<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="24" fill="none" stroke="#64748b" stroke-opacity="0.35" stroke-width="1.5"/>
${body}
</svg>
`;
}

const title = (str) => t(W / 2, 128, str, { size: 56, weight: 700, fill: C.ink, anchor: 'middle' });

// Single centred card: header on top, icon, centred body lines.
function singleCard({ x, y, w, h, color, label, iconName, body = [], bodyY, lineH = 28, extra = '' }) {
  const cx = x + w / 2;
  let s = panel({ x, y, w, h, color });
  s += t(cx, y + 40, label, { size: 22, weight: 700, fill: color, anchor: 'middle' });
  if (iconName) s += icon(iconName, cx - 22, y + 60, 44, color);
  const by = bodyY ?? y + 140;
  body.forEach((ln, i) => {
    s += t(cx, by + i * lineH, ln, { size: 22, anchor: 'middle' });
  });
  return s + extra;
}

// ---------------------------------------------------------------- overview
function overview() {
  let s = title('claude-slim at a glance');

  // Launcher
  const L = { x: 50, y: 380, w: 240, h: 220 };
  s += singleCard({
    ...L,
    color: C.cyan,
    label: 'launcher',
    iconName: 'terminal',
    body: ['`claude-slim`', '`--preset <name>`'],
    bodyY: L.y + 152,
    lineH: 34,
  });

  // Three inputs
  const IX = 340;
  const IW = 420;
  const IH = 124;
  const inputs = [
    { y: 280, label: 'roster', iconName: 'gear', file: 'build-agents.mjs', flag: '`--agents` roster' },
    { y: 428, label: 'prompt', iconName: 'file', file: 'orchestrator.md', flag: '`--append-system-prompt-file`' },
    { y: 576, label: 'hooks', iconName: 'file', file: 'settings.json', flag: '`--settings` hooks' },
  ];
  inputs.forEach((i) => {
    s += panel({ x: IX, y: i.y, w: IW, h: IH, color: C.blue });
    s += t(IX + 22, i.y + 36, i.label, { size: 22, weight: 700, fill: C.blue });
    s += icon(i.iconName, IX + IW - 60, i.y + 16, 40, C.blue);
    s += t(IX + 22, i.y + 78, `\`${i.file}\``, { size: 24 });
    s += t(IX + 22, i.y + 108, i.flag, { size: 22 });
  });

  // Central orchestrator
  const O = { x: 830, y: 350, w: 270, h: 280 };
  const ocx = O.x + O.w / 2;
  s += panel({ ...O, color: C.amber });
  s += t(ocx, O.y + 40, 'Orchestrator', { size: 22, weight: 700, fill: C.amber, anchor: 'middle' });
  s += icon('hub', ocx - 22, O.y + 58, 44, C.amber);
  s += t(ocx, O.y + 132, '(main session)', { size: 22, anchor: 'middle', fill: C.muted });
  s += `<path d="M${O.x + 36} ${O.y + 150} H${O.x + O.w - 36}" stroke="${C.amber}" stroke-opacity="0.35" stroke-width="1.5"/>`;
  ['plans · dispatches', 'checks results', 'runs final gates'].forEach((ln, i) => {
    s += t(ocx, O.y + 186 + i * 28, ln, { size: 22, anchor: 'middle' });
  });

  // Lanes
  const LX = 1160;
  const LW = 390;
  const ro = { y: 220, h: 160 };
  s += panel({ x: LX, y: ro.y, w: LW, h: ro.h, color: C.teal, dashed: true });
  s += t(LX + 22, ro.y + 40, 'read-only', { size: 22, weight: 700, fill: C.teal });
  const r1 = ro.y + 62;
  const r2 = ro.y + 108;
  s += icon('magnifier', LX + 22, r1, 30, C.teal) + t(LX + 62, r1 + 22, '`explorer`', { size: 22 });
  s += icon('book', LX + 200, r1, 30, C.teal) + t(LX + 240, r1 + 22, '`librarian`', { size: 22 });
  s += icon('eye', LX + 22, r2, 30, C.teal) + t(LX + 62, r2 + 22, '`observer`', { size: 22 });
  s += icon('bulb', LX + 200, r2, 30, C.teal) + t(LX + 240, r2 + 22, '`oracle`', { size: 22 });

  const wr = { y: 406, h: 150 };
  s += panel({ x: LX, y: wr.y, w: LW, h: wr.h, color: C.red });
  s += t(LX + 22, wr.y + 40, 'writers', { size: 22, weight: 700, fill: C.red });
  s += icon('wrench', LX + 22, wr.y + 62, 30, C.red) + t(LX + 62, wr.y + 84, '`fixer`', { size: 22 });
  s += icon('pen', LX + 200, wr.y + 62, 30, C.red) + t(LX + 240, wr.y + 84, '`designer`', { size: 22 });
  s += t(LX + 22, wr.y + 130, 'one owner per scope', { size: 22, italic: true, fill: C.muted });

  const rq = { y: 582, h: 170 };
  s += panel({ x: LX, y: rq.y, w: LW, h: rq.h, color: C.purple });
  s += t(LX + 22, rq.y + 40, 'on request', { size: 22, weight: 700, fill: C.purple });
  const seats = [
    { g: 'α', c: C.blue },
    { g: 'β', c: C.purple },
    { g: 'γ', c: C.teal },
  ];
  seats.forEach((st, i) => {
    const sx = LX + 22 + i * 120;
    s += icon('person', sx, rq.y + 62, 30, st.c);
    s += t(sx + 40, rq.y + 85, `\`${st.g}\``, { size: 26, fill: st.c });
  });
  s += t(LX + 22, rq.y + 138, 'councillors → `council`', { size: 22 });

  // Arrows: launcher -> inputs (cyan, from the launcher)
  inputs.forEach((i) => {
    s += arrow(link(290, 490, IX, i.y + IH / 2), C.cyan);
  });
  // Inputs -> orchestrator (blue, from the inputs)
  [420, 490, 560].forEach((ey, i) => {
    s += arrow(link(IX + IW, inputs[i].y + IH / 2, O.x, ey), C.blue);
  });
  // Orchestrator -> lanes (colour of the lane it enters)
  s += arrow(link(O.x + O.w, 490, LX, ro.y + ro.h / 2), C.teal, { dashed: true });
  s += arrow(link(O.x + O.w, 490, LX, wr.y + wr.h / 2), C.red);
  s += arrow(link(O.x + O.w, 490, LX, rq.y + rq.h / 2), C.purple);

  return s;
}

// ---------------------------------------------------------------- work graph
function workGraph() {
  let s = title('A typical feature, as lanes');
  const FY = 210;
  const FH = 470;
  const FW = 320;
  const xs = [93, 458, 823, 1188];
  const stageColor = [C.teal, C.amber, C.red, C.green];
  const mid = FY + FH / 2; // 445

  xs.forEach((x, i) => {
    s += panel({ x, y: FY, w: FW, h: FH, color: stageColor[i], glow: true, op: 0.05 });
    s += t(x + 24, FY + 52, `STAGE ${i + 1}`, { size: 22, weight: 700, fill: stageColor[i], ls: 2 });
    s += t(x + FW - 22, FY + 84, String(i + 1), { size: 60, weight: 700, fill: stageColor[i], anchor: 'end', opacity: 0.9 });
  });

  const sub = ({ x, y, color, dashed = false, iconName, name, body = [] }) => {
    const w = FW - 36;
    const h = 130;
    let o = panel({ x, y, w, h, color, dashed, op: 0.14, r: 14 });
    o += t(x + 20, y + 46, `\`${name}\``, { size: 24 });
    if (iconName) o += icon(iconName, x + w - 52, y + 20, 34, color);
    body.forEach((ln, i) => {
      o += t(x + 20, y + 92 + i * 26, ln, { size: 22 });
    });
    return o;
  };

  const inX = (i) => xs[i] + 18;
  // Stage 1: parallel recon
  s += sub({ x: inX(0), y: 302, color: C.teal, dashed: true, iconName: 'magnifier', name: 'explorer', body: ['map the code'] });
  s += sub({ x: inX(0), y: 458, color: C.teal, dashed: true, iconName: 'book', name: 'librarian', body: ['read the docs'] });
  // Stage 2: orchestrator writes specs
  s += sub({ x: inX(1), y: mid - 65, color: C.amber, iconName: 'hub', name: 'orchestrator', body: ['writes the specs'] });
  // Stage 3: two writers on disjoint paths
  s += sub({ x: inX(2), y: 302, color: C.red, iconName: 'wrench', name: 'fixer #1', body: ['`src/routes/`'] });
  s += sub({ x: inX(2), y: 458, color: C.red, iconName: 'wrench', name: 'fixer #2', body: ['`src/lib/`'] });
  s += t(xs[2] + FW / 2, 642, 'no shared files', { size: 22, italic: true, fill: C.muted, anchor: 'middle' });
  // Stage 4: final gates
  s += sub({ x: inX(3), y: mid - 65, color: C.amber, iconName: 'hub', name: 'orchestrator', body: ['build · tests', 'typecheck'] });

  // Stage transitions
  for (let i = 0; i < 3; i++) {
    s += arrow(`M${xs[i] + FW + 4} ${mid} L${xs[i + 1] - 4} ${mid}`, stageColor[i + 1]);
  }

  // Time axis
  s += t(93, 762, 'time', { size: 22, fill: C.muted });
  s += arrow('M93 782 L1508 782', C.muted, { w: 2 });

  return s;
}

// ---------------------------------------------------------------- presets
function presets() {
  let s = title('How a preset becomes a roster');
  const CODE = '#e2e8f0';

  // Input A: presets/premium.json
  const A = { x: 120, y: 190, w: 660, h: 280 };
  s += panel({ ...A, color: C.cyan });
  s += t(A.x + 26, A.y + 42, 'preset', { size: 22, weight: 700, fill: C.cyan });
  s += icon('file', A.x + A.w - 62, A.y + 20, 40, C.cyan);
  s += t(A.x + 26, A.y + 86, '`presets/premium.json`', { size: 24 });
  [
    '{ "fixer": {',
    '    "model": "opus",',
    '    "effort": "medium" } }',
  ].forEach((ln, i) => {
    s += t(A.x + 26, A.y + 140 + i * 34, ln, { size: 22, family: MONO, fill: CODE });
  });

  // Input B: ~/.claude/agents/fixer.md
  const B = { x: 820, y: 190, w: 660, h: 280 };
  s += panel({ ...B, color: C.purple });
  s += t(B.x + 26, B.y + 42, 'agent file', { size: 22, weight: 700, fill: C.purple });
  s += icon('file', B.x + B.w - 62, B.y + 20, 40, C.purple);
  s += t(B.x + 26, B.y + 86, '`~/.claude/agents/fixer.md`', { size: 24 });
  [
    '---',
    'model: haiku',
    'effort: high',
    'tools: ...',
    '---',
    '<prompt>',
  ].forEach((ln, i) => {
    s += t(B.x + 26, B.y + 124 + i * 26, ln, { size: 22, family: MONO, fill: CODE });
  });

  // Build step
  const M = { x: 420, y: 530, w: 760, h: 130 };
  s += panel({ ...M, color: C.blue });
  s += t(M.x + 26, M.y + 46, '`build-agents.mjs`', { size: 24 });
  s += icon('gear', M.x + M.w - 62, M.y + 18, 40, C.blue);
  s += t(M.x + 26, M.y + 88, 'parse frontmatter (`Bun.YAML`) · keep prompt, tools, hooks', { size: 22 });
  s += t(M.x + 26, M.y + 116, 'overwrite `model` + `effort`', { size: 22 });

  // Output
  const O = { x: 200, y: 700, w: 1200, h: 140 };
  s += panel({ ...O, color: C.green });
  s += t(O.x + 26, O.y + 42, 'roster', { size: 22, weight: 700, fill: C.green });
  s += t(O.x + 26, O.y + 86, `--agents '{"fixer":{"model":"opus","effort":"medium",...}}'`, {
    size: 24,
    family: MONO,
    fill: C.ink,
    weight: 700,
  });
  s += t(O.x + 26, O.y + 120, 'overrides `~/.claude/agents/fixer.md` for this session only', { size: 22, italic: true, fill: C.muted });

  // Arrows
  s += arrow(vlink(450, A.y + A.h, 600, M.y), C.cyan);
  s += arrow(vlink(1150, B.y + B.h, 1000, M.y), C.purple);
  s += arrow(vlink(800, M.y + M.h, 800, O.y), C.blue);

  return s;
}

// ---------------------------------------------------------------- council
function council() {
  let s = title('Council Mode');
  const Y = 370; // single cards: 240 tall, centred on y=490
  const HH = 240;

  // 1. Question
  s += singleCard({ x: 60, y: Y, w: 200, h: HH, color: C.cyan, label: '1. Question', bodyY: Y + 200,
    extra: t(160, Y + 196, '?', { size: 120, weight: 700, fill: C.cyan, anchor: 'middle' }) });

  // 2. Orchestrator fetches
  s += singleCard({ x: 305, y: Y, w: 270, h: HH, color: C.amber, label: '2. Orchestrator', iconName: 'hub',
    body: ['fetches PR / URL /', 'issue first'] });

  // 3. Councillors (container with three parallel seats)
  const K = { x: 620, y: 250, w: 270, h: 480 };
  s += panel({ ...K, color: C.muted, glow: false, op: 0.04, r: 18 });
  s += t(K.x + 24, K.y + 42, '3. Councillors', { size: 22, weight: 700, fill: C.body });
  const seats = [
    { name: 'alpha', model: 'Opus', color: C.blue },
    { name: 'beta', model: 'Fable', color: C.purple },
    { name: 'gamma', model: 'Sonnet', color: C.teal },
  ];
  seats.forEach((st, i) => {
    const sx = K.x + 16;
    const sy = 310 + i * 142;
    const sw = K.w - 32;
    s += panel({ x: sx, y: sy, w: sw, h: 120, color: st.color, op: 0.14, r: 14 });
    s += icon('person', sx + 18, sy + 40, 40, st.color);
    s += t(sx + 74, sy + 56, st.name, { size: 28, weight: 700, fill: st.color });
    s += t(sx + 74, sy + 88, st.model, { size: 22 });
  });

  // 4. Orchestrator collects
  s += singleCard({ x: 925, y: Y, w: 270, h: HH, color: C.amber, label: '4. Orchestrator', iconName: 'hub',
    body: ['collects all three', 'retries an empty', 'seat once'] });

  // 5. Council
  s += singleCard({ x: 1250, y: Y, w: 290, h: HH, color: C.green, label: '5. Council', iconName: 'scales',
    body: ['one report', 'keeps disagreements'] });

  // Arrows
  s += arrow(`M260 490 L305 490`, C.cyan);
  seats.forEach((st, i) => {
    const sy = 310 + i * 142 + 60;
    s += arrow(link(575, 490, K.x + 16, sy), st.color);
  });
  seats.forEach((st, i) => {
    const sy = 310 + i * 142 + 60;
    s += arrow(link(K.x + K.w - 16, sy, 925, 490), st.color);
  });
  s += arrow(`M1195 490 L1250 490`, C.green);

  return s;
}

// ---------------------------------------------------------------- render
const DIAGRAMS = [
  { name: 'overview', build: overview },
  { name: 'work-graph', build: workGraph },
  { name: 'presets', build: presets },
  { name: 'council', build: council },
];

async function main() {
  mkdirSync(SVG_DIR, { recursive: true });
  mkdirSync(PNG_DIR, { recursive: true });

  for (const d of DIAGRAMS) {
    const svg = svgDoc(d.build());
    const svgPath = join(SVG_DIR, `${d.name}.svg`);
    writeFileSync(svgPath, svg);

    const pngPath = join(PNG_DIR, `${d.name}.png`);
    await sharp(Buffer.from(svg), { density: DENSITY })
      .png({ compressionLevel: 9, palette: true, effort: 10 })
      .toFile(pngPath);

    const kb = (statSync(pngPath).size / 1024).toFixed(0);
    console.log(`${d.name}: ${svgPath}`);
    console.log(`  ${pngPath} (${kb} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
