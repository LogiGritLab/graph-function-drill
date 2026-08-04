/**
 * グラフ関数ドリル / Graph Function Drill
 * 直線・放物線・双曲線 — グラフと式の対応練習（3択）
 */

/* ========== Meta ========== */
const TYPE_META = {
  linear: { labelJa: '直線', labelEn: 'Linear' },
  parabola: { labelJa: '放物線', labelEn: 'Parabola' },
  hyperbola: { labelJa: '双曲線', labelEn: 'Hyperbola' }
};

const FORM_OPTIONS = {
  linear: [
    { id: 'ax', labelJa: 'y = ax', labelEn: 'y = ax' },
    { id: 'axb', labelJa: 'y = ax + b', labelEn: 'y = ax + b' }
  ],
  parabola: [
    { id: 'ax2', labelJa: 'y = ax²', labelEn: 'y = ax²' },
    { id: 'ax2q', labelJa: 'y = ax² + q', labelEn: 'y = ax² + q' },
    { id: 'axp2', labelJa: 'y = a(x − p)²', labelEn: 'y = a(x − p)²' },
    { id: 'axp2q', labelJa: 'y = a(x − p)² + q', labelEn: 'y = a(x − p)² + q' }
  ],
  hyperbola: [
    { id: 'kx', labelJa: 'y = k/x', labelEn: 'y = k/x' },
    { id: 'kxp', labelJa: 'y = k/(x − p)', labelEn: 'y = k/(x − p)' },
    { id: 'kxpq', labelJa: 'y − q = k/(x − p)', labelEn: 'y − q = k/(x − p)' }
  ]
};

const MODE_META = {
  g2f: { labelJa: 'グラフ→式', labelEn: 'Graph → Formula' },
  f2g: { labelJa: '式→グラフ', labelEn: 'Formula → Graph' }
};

/* ========== DOM ========== */
const typeMenu = document.getElementById('typeMenu');
const formMenu = document.getElementById('formMenu');
const modeMenu = document.getElementById('modeMenu');
const subTitle = document.getElementById('subTitle');
const feedbackEl = document.getElementById('feedback');
const feedbackTextEl = document.getElementById('feedbackText');
const explanationEl = document.getElementById('explanation');
const nextProblemBtn = document.getElementById('nextProblemBtn');
const questionArea = document.getElementById('questionArea');
const choicesEl = document.getElementById('choices');
const inputHint = document.getElementById('inputHint');
const correctCountEl = document.getElementById('correctCount');
const wrongCountEl = document.getElementById('wrongCount');
const streakCountEl = document.getElementById('streakCount');
const resetBtn = document.getElementById('resetBtn');

/* ========== State ========== */
let currentType = 'linear';
let currentForm = 'ax';
let currentMode = 'g2f';
let correctCount = 0;
let wrongCount = 0;
let streak = 0;
let locked = false;
let currentProblem = null;
let lastSignature = '';

/* ========== Utils ========== */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function signed(n) {
  if (n >= 0) return `+ ${n}`;
  return `− ${Math.abs(n)}`;
}

function coeff(n, varName) {
  if (n === 1) return varName;
  if (n === -1) return `−${varName}`;
  if (n < 0) return `−${Math.abs(n)}${varName}`;
  return `${n}${varName}`;
}

function fmtNum(n) {
  return String(n);
}

function paramsKey(params) {
  return JSON.stringify(params);
}

/* ========== Math / evaluate ========== */
function evalFn(form, params, x) {
  const { a, b, p, q, k } = params;
  switch (form) {
    case 'ax': return a * x;
    case 'axb': return a * x + b;
    case 'ax2': return a * x * x;
    case 'ax2q': return a * x * x + q;
    case 'axp2': return a * (x - p) * (x - p);
    case 'axp2q': return a * (x - p) * (x - p) + q;
    case 'kx': return k / x;
    case 'kxp': return k / (x - p);
    case 'kxpq': return k / (x - p) + q;
    default: return NaN;
  }
}

function domainOf(form, params) {
  if (form === 'kx') {
    return { ja: 'x ≠ 0', en: 'x ≠ 0', exclude: [0] };
  }
  if (form === 'kxp' || form === 'kxpq') {
    const p = params.p;
    return { ja: `x ≠ ${p}`, en: `x ≠ ${p}`, exclude: [p] };
  }
  return { ja: 'すべての実数 / all real numbers', en: 'all real numbers', exclude: [] };
}

function asymptotesOf(form, params) {
  if (form === 'kx') return [{ type: 'v', value: 0 }, { type: 'h', value: 0 }];
  if (form === 'kxp') return [{ type: 'v', value: params.p }, { type: 'h', value: 0 }];
  if (form === 'kxpq') return [{ type: 'v', value: params.p }, { type: 'h', value: params.q }];
  return [];
}

function formatFormula(form, params, withDomain = true) {
  const { a, b, p, q, k } = params;
  let main = '';

  switch (form) {
    case 'ax':
      main = `y = ${coeff(a, 'x')}`;
      break;
    case 'axb': {
      if (b === 0) main = `y = ${coeff(a, 'x')}`;
      else main = `y = ${coeff(a, 'x')} ${signed(b)}`;
      break;
    }
    case 'ax2':
      main = `y = ${coeff(a, 'x²')}`;
      break;
    case 'ax2q': {
      if (q === 0) main = `y = ${coeff(a, 'x²')}`;
      else main = `y = ${coeff(a, 'x²')} ${signed(q)}`;
      break;
    }
    case 'axp2': {
      const inner = p === 0 ? 'x' : `(x ${signed(-p)})`;
      main = `y = ${a === 1 ? '' : a === -1 ? '−' : a}${inner === 'x' ? 'x²' : `${inner}²`}`;
      break;
    }
    case 'axp2q': {
      const inner = p === 0 ? 'x' : `(x ${signed(-p)})`;
      const left = `${a === 1 ? '' : a === -1 ? '−' : a}${inner === 'x' ? 'x²' : `${inner}²`}`;
      if (q === 0) main = `y = ${left}`;
      else main = `y = ${left} ${signed(q)}`;
      break;
    }
    case 'kx':
      main = `y = ${k}/x`;
      break;
    case 'kxp': {
      const den = p === 0 ? 'x' : `(x ${signed(-p)})`;
      main = `y = ${k}/${den}`;
      break;
    }
    case 'kxpq': {
      const den = p === 0 ? 'x' : `(x ${signed(-p)})`;
      // メニュー表記に合わせた標準形: y − q = k/(x − p)
      if (q === 0) main = `y = ${k}/${den}`;
      else main = `y ${signed(-q)} = ${k}/${den}`;
      break;
    }
    default:
      main = 'y = ?';
  }

  if (!withDomain) return { main, domain: null, html: main };

  const dom = domainOf(form, params);
  const domainText = form.startsWith('k')
    ? `（定義域 / domain: ${dom.ja}）`
    : '';
  return {
    main,
    domain: dom,
    domainText,
    html: domainText
      ? `${main}<span class="domain">${domainText}</span>`
      : main
  };
}

/* ========== Parameter generation ========== */
const NONZERO = [-3, -2, -1, 1, 2, 3];
const NONZERO_WIDE = [-4, -3, -2, -1, 1, 2, 3, 4];
const SHIFT = [-3, -2, -1, 1, 2, 3];

function genParams(form) {
  switch (form) {
    case 'ax':
      return { a: pick(NONZERO) };
    case 'axb':
      return { a: pick(NONZERO), b: pick(SHIFT) };
    case 'ax2':
      return { a: pick(NONZERO) };
    case 'ax2q':
      return { a: pick(NONZERO), q: pick(SHIFT) };
    case 'axp2':
      return { a: pick(NONZERO), p: pick(SHIFT) };
    case 'axp2q':
      return { a: pick(NONZERO), p: pick(SHIFT), q: pick(SHIFT) };
    case 'kx':
      // k は ±1〜±6（整数点が出やすい）
      return { k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]) };
    case 'kxp':
      return {
        k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]),
        p: pick(SHIFT)
      };
    case 'kxpq':
      return {
        k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]),
        p: pick(SHIFT),
        q: pick(SHIFT)
      };
    default:
      return {};
  }
}

/** 正解に近い紛らわしい distractor を生成 */
function genDistractors(form, correct) {
  const c = { ...correct };
  const candidates = [];

  const push = (obj) => {
    // ゼロ係数・無意味パラメータを除外
    if (obj.a === 0 || obj.k === 0) return;
    if (paramsKey(obj) === paramsKey(c)) return;
    candidates.push(obj);
  };

  switch (form) {
    case 'ax':
      push({ a: -c.a });
      push({ a: c.a > 0 ? c.a + 1 : c.a - 1 });
      push({ a: c.a > 0 ? c.a - 1 || 2 : c.a + 1 || -2 });
      if (Math.abs(c.a) !== 2) push({ a: c.a > 0 ? 2 : -2 });
      push({ a: c.a === 1 ? 3 : c.a === -1 ? -3 : (c.a > 0 ? 1 : -1) });
      break;

    case 'axb':
      push({ a: -c.a, b: c.b });
      push({ a: c.a, b: -c.b });
      push({ a: -c.a, b: -c.b });
      push({ a: c.a, b: c.b + (c.b > 0 ? -1 : 1) || 2 });
      push({ a: c.a + (c.a > 0 ? 1 : -1) || 2, b: c.b });
      push({ a: c.b !== 0 && Math.abs(c.b) <= 3 ? c.b : c.a, b: c.a }); // 係数と切片の入れ替え風
      break;

    case 'ax2':
      push({ a: -c.a });
      push({ a: c.a > 0 ? c.a + 1 : c.a - 1 });
      push({ a: c.a > 0 ? Math.max(1, c.a - 1) : Math.min(-1, c.a + 1) });
      push({ a: c.a === 1 ? 2 : c.a === -1 ? -2 : (c.a > 0 ? 1 : -1) });
      break;

    case 'ax2q':
      push({ a: -c.a, q: c.q });
      push({ a: c.a, q: -c.q });
      push({ a: -c.a, q: -c.q });
      push({ a: c.a, q: c.q + (c.q > 0 ? 1 : -1) || 2 });
      push({ a: c.a + (c.a > 0 ? 1 : -1) || 2, q: c.q });
      break;

    case 'axp2':
      push({ a: -c.a, p: c.p });
      push({ a: c.a, p: -c.p });
      push({ a: -c.a, p: -c.p });
      push({ a: c.a, p: c.p + (c.p > 0 ? 1 : -1) || 2 });
      push({ a: c.a + (c.a > 0 ? 1 : -1) || 2, p: c.p });
      break;

    case 'axp2q':
      push({ a: -c.a, p: c.p, q: c.q });
      push({ a: c.a, p: -c.p, q: c.q });
      push({ a: c.a, p: c.p, q: -c.q });
      push({ a: c.a, p: -c.p, q: -c.q });
      push({ a: -c.a, p: c.p, q: -c.q });
      push({ a: c.a, p: c.p + (c.p > 0 ? 1 : -1) || 2, q: c.q });
      push({ a: c.a, p: c.p, q: c.q + (c.q > 0 ? 1 : -1) || 2 });
      break;

    case 'kx':
      push({ k: -c.k });
      push({ k: c.k > 0 ? c.k + 1 : c.k - 1 });
      push({ k: c.k > 0 ? Math.max(1, c.k - 1) : Math.min(-1, c.k + 1) });
      push({ k: c.k === 2 ? 4 : c.k === -2 ? -4 : (c.k > 0 ? 2 : -2) });
      push({ k: c.k === 1 ? 3 : c.k === -1 ? -3 : (c.k > 0 ? 1 : -1) });
      break;

    case 'kxp':
      push({ k: -c.k, p: c.p });
      push({ k: c.k, p: -c.p });
      push({ k: -c.k, p: -c.p });
      push({ k: c.k + (c.k > 0 ? 1 : -1) || 2, p: c.p });
      push({ k: c.k, p: c.p + (c.p > 0 ? 1 : -1) || 2 });
      break;

    case 'kxpq':
      push({ k: -c.k, p: c.p, q: c.q });
      push({ k: c.k, p: -c.p, q: c.q });
      push({ k: c.k, p: c.p, q: -c.q });
      push({ k: c.k, p: -c.p, q: -c.q });
      push({ k: -c.k, p: c.p, q: -c.q });
      push({ k: c.k, p: c.p + (c.p > 0 ? 1 : -1) || 2, q: c.q });
      push({ k: c.k, p: c.p, q: c.q + (c.q > 0 ? 1 : -1) || 2 });
      // p と q の入れ替え（紛らわしい）
      if (c.p !== c.q && c.q !== 0) push({ k: c.k, p: c.q, q: c.p });
      break;
  }

  // 足りない場合はランダム近傍を追加
  let guard = 0;
  while (uniqueBy(candidates, paramsKey).length < 4 && guard < 40) {
    guard += 1;
    const d = { ...c };
    const keys = Object.keys(d);
    const key = pick(keys);
    const delta = pick([-2, -1, 1, 2]);
    d[key] = d[key] + delta;
    if (d[key] === 0 && (key === 'a' || key === 'k')) d[key] = delta > 0 ? 1 : -1;
    push(d);
  }

  return uniqueBy(candidates, paramsKey).slice(0, 8);
}

/* ========== Integer sample points ========== */
function samplePoints(form, params, limit = 6) {
  const points = [];
  const exclude = new Set(domainOf(form, params).exclude);
  const range = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 0, -6, 6];

  for (const x of range) {
    if (exclude.has(x)) continue;
    const y = evalFn(form, params, x);
    if (!Number.isFinite(y)) continue;
    // 整数座標のみ
    if (Math.abs(y - Math.round(y)) > 1e-9) continue;
    const yi = Math.round(y);
    if (Math.abs(yi) > 12) continue;
    if (Math.abs(x) > 6 && Math.abs(yi) > 6) continue;
    points.push({ x, y: yi });
    if (points.length >= limit) break;
  }

  // 双曲線で点が少ない場合、約数から追加
  if ((form === 'kx' || form === 'kxp' || form === 'kxpq') && points.length < 4) {
    const k = params.k;
    const p = params.p || 0;
    const q = params.q || 0;
    const divisors = [];
    for (let d = 1; d <= Math.abs(k); d++) {
      if (Math.abs(k) % d === 0) {
        divisors.push(d, -d);
      }
    }
    for (const t of shuffle(divisors)) {
      // y - q = k / (x - p)  ⇒  x - p = k / (y - q) だが t = x-p とする
      const x = t + p;
      if (exclude.has(x)) continue;
      if (Math.abs(x) > 7) continue;
      const y = k / t + q;
      if (!Number.isFinite(y)) continue;
      if (Math.abs(y - Math.round(y)) > 1e-9) continue;
      const yi = Math.round(y);
      if (Math.abs(yi) > 12) continue;
      if (!points.some((pt) => pt.x === x && pt.y === yi)) {
        points.push({ x, y: yi });
      }
      if (points.length >= limit) break;
    }
  }

  return points.slice(0, limit);
}

/* ========== SVG Graph ========== */
const GRAPH_VIEW = { min: -6, max: 6, pad: 18 };

function worldToSvg(x, y, size = 320) {
  const { min, max, pad } = GRAPH_VIEW;
  const usable = size - pad * 2;
  const sx = pad + ((x - min) / (max - min)) * usable;
  const sy = pad + ((max - y) / (max - min)) * usable;
  return [sx, sy];
}

function buildGraphSvg(form, params, opts = {}) {
  const {
    size = 320,
    showPoints = true,
    showAsymptotes = true,
    compact = false
  } = opts;

  const { min, max, pad } = GRAPH_VIEW;
  const usable = size - pad * 2;
  const unit = usable / (max - min);

  const parts = [];
  parts.push(`<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="graph">`);

  // background
  parts.push(`<rect width="${size}" height="${size}" fill="#ffffff"/>`);

  // grid
  for (let i = min; i <= max; i++) {
    const [gx] = worldToSvg(i, 0, size);
    const [, gy] = worldToSvg(0, i, size);
    const isAxis = i === 0;
    if (isAxis) continue;
    parts.push(`<line x1="${gx}" y1="${pad}" x2="${gx}" y2="${size - pad}" stroke="#e8eef5" stroke-width="1"/>`);
    parts.push(`<line x1="${pad}" y1="${gy}" x2="${size - pad}" y2="${gy}" stroke="#e8eef5" stroke-width="1"/>`);
  }

  // axes
  const [ox, oy] = worldToSvg(0, 0, size);
  parts.push(`<line x1="${pad}" y1="${oy}" x2="${size - pad}" y2="${oy}" stroke="#333" stroke-width="1.6"/>`);
  parts.push(`<line x1="${ox}" y1="${pad}" x2="${ox}" y2="${size - pad}" stroke="#333" stroke-width="1.6"/>`);

  // arrow heads
  parts.push(`<polygon points="${size - pad},${oy} ${size - pad - 7},${oy - 4} ${size - pad - 7},${oy + 4}" fill="#333"/>`);
  parts.push(`<polygon points="${ox},${pad} ${ox - 4},${pad + 7} ${ox + 4},${pad + 7}" fill="#333"/>`);

  // axis labels
  if (!compact) {
    parts.push(`<text x="${size - pad - 2}" y="${oy - 8}" font-size="12" font-weight="700" fill="#333" text-anchor="end">x</text>`);
    parts.push(`<text x="${ox + 8}" y="${pad + 12}" font-size="12" font-weight="700" fill="#333">y</text>`);

    for (let i = min; i <= max; i++) {
      if (i === 0) continue;
      if (compact && Math.abs(i) % 2 !== 0) continue;
      const [tx] = worldToSvg(i, 0, size);
      const [, ty] = worldToSvg(0, i, size);
      parts.push(`<text x="${tx}" y="${oy + 14}" font-size="10" fill="#666" text-anchor="middle">${i}</text>`);
      parts.push(`<text x="${ox - 6}" y="${ty + 4}" font-size="10" fill="#666" text-anchor="end">${i}</text>`);
      // ticks
      parts.push(`<line x1="${tx}" y1="${oy - 3}" x2="${tx}" y2="${oy + 3}" stroke="#333" stroke-width="1"/>`);
      parts.push(`<line x1="${ox - 3}" y1="${ty}" x2="${ox + 3}" y2="${ty}" stroke="#333" stroke-width="1"/>`);
    }
  }

  // asymptotes
  if (showAsymptotes) {
    const asy = asymptotesOf(form, params);
    for (const a of asy) {
      if (a.type === 'v') {
        if (a.value < min || a.value > max) continue;
        const [ax] = worldToSvg(a.value, 0, size);
        parts.push(`<line x1="${ax}" y1="${pad}" x2="${ax}" y2="${size - pad}" stroke="#c8241a" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>`);
        if (!compact) {
          parts.push(`<text x="${ax + 4}" y="${pad + 14}" font-size="10" fill="#c8241a" font-weight="700">x=${a.value}</text>`);
        }
      } else {
        if (a.value < min || a.value > max) continue;
        const [, ay] = worldToSvg(0, a.value, size);
        parts.push(`<line x1="${pad}" y1="${ay}" x2="${size - pad}" y2="${ay}" stroke="#c8241a" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>`);
        if (!compact) {
          parts.push(`<text x="${pad + 4}" y="${ay - 5}" font-size="10" fill="#c8241a" font-weight="700">y=${a.value}</text>`);
        }
      }
    }
  }

  // curve path(s)
  const exclude = domainOf(form, params).exclude;
  const isHyperbola = form === 'kx' || form === 'kxp' || form === 'kxpq';

  function buildPath(xStart, xEnd, step) {
    const pts = [];
    let penUp = true;
    for (let x = xStart; x <= xEnd + 1e-9; x += step) {
      // skip near excluded asymptotes
      let nearAsy = false;
      for (const ex of exclude) {
        if (Math.abs(x - ex) < 0.08) nearAsy = true;
      }
      if (nearAsy) {
        penUp = true;
        continue;
      }
      const y = evalFn(form, params, x);
      if (!Number.isFinite(y) || Math.abs(y) > 20) {
        penUp = true;
        continue;
      }
      // clip slightly outside view
      if (y < min - 1 || y > max + 1) {
        penUp = true;
        continue;
      }
      const [sx, sy] = worldToSvg(x, y, size);
      if (penUp) {
        pts.push(`M ${sx.toFixed(2)} ${sy.toFixed(2)}`);
        penUp = false;
      } else {
        pts.push(`L ${sx.toFixed(2)} ${sy.toFixed(2)}`);
      }
    }
    return pts.join(' ');
  }

  const step = isHyperbola ? 0.04 : 0.06;

  if (isHyperbola && exclude.length) {
    const ex = exclude[0];
    // left branch
    const left = buildPath(min, ex - 0.12, step);
    const right = buildPath(ex + 0.12, max, step);
    if (left) parts.push(`<path d="${left}" fill="none" stroke="#1a5084" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (right) parts.push(`<path d="${right}" fill="none" stroke="#1a5084" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else {
    const d = buildPath(min, max, step);
    if (d) parts.push(`<path d="${d}" fill="none" stroke="#1a5084" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  // integer points
  if (showPoints) {
    const pts = samplePoints(form, params, compact ? 4 : 6);
    for (const pt of pts) {
      if (pt.x < min || pt.x > max || pt.y < min || pt.y > max) continue;
      const [sx, sy] = worldToSvg(pt.x, pt.y, size);
      parts.push(`<circle cx="${sx}" cy="${sy}" r="${compact ? 3.2 : 4}" fill="#c8241a" stroke="#fff" stroke-width="1.2"/>`);
      if (!compact) {
        const label = `(${pt.x}, ${pt.y})`;
        // place label to avoid edge overflow
        let lx = sx + 6;
        let ly = sy - 8;
        let anchor = 'start';
        if (sx > size * 0.62) {
          lx = sx - 6;
          anchor = 'end';
        }
        if (sy < pad + 20) ly = sy + 14;
        parts.push(`<text x="${lx}" y="${ly}" font-size="10" font-weight="700" fill="#c8241a" text-anchor="${anchor}">${label}</text>`);
      }
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

/* ========== Explanations ========== */
function buildExplanation(form, params, mode) {
  const f = formatFormula(form, params, false).main;
  const { a, b, p, q, k } = params;
  const lines = [];

  if (mode === 'g2f') {
    lines.push(`【答え / Answer】 ${f}`);
    const dom = domainOf(form, params);
    if (form.startsWith('k')) {
      lines.push(`定義域 / Domain: ${dom.ja}`);
    }
    lines.push('');
    lines.push('【解説 / Explanation】');
  } else {
    lines.push('【解説 / Explanation】式から読み取れる特徴 / Features from the formula:');
  }

  switch (form) {
    case 'ax':
      lines.push(`・原点 (0, 0) を通る直線 / Line through the origin (0, 0)`);
      lines.push(`・傾き（斜率）a = ${a} ${a > 0 ? '（右上がり / rising to the right）' : '（右下がり / falling to the right）'}`);
      lines.push(`・例: x = 1 のとき y = ${a} → 点 (1, ${a})`);
      break;
    case 'axb':
      lines.push(`・傾き a = ${a} ${a > 0 ? '（右上がり）' : '（右下がり）'} / slope a = ${a}`);
      lines.push(`・y切片 b = ${b} → 点 (0, ${b}) を通る / y-intercept b = ${b}`);
      lines.push(`・x = 1 のとき y = ${a + b} → 点 (1, ${a + b})`);
      break;
    case 'ax2':
      lines.push(`・頂点は原点 (0, 0) / Vertex at (0, 0)`);
      lines.push(`・a = ${a} ${a > 0 ? '→ 下に凸（上に開く）/ opens upward' : '→ 上に凸（下に開く）/ opens downward'}`);
      lines.push(`・|a| が大きいほど急な放物線 / larger |a| → steeper parabola`);
      lines.push(`・例: x = 1 → y = ${a}, x = 2 → y = ${a * 4}`);
      break;
    case 'ax2q':
      lines.push(`・頂点は (0, ${q}) / Vertex at (0, ${q})`);
      lines.push(`・y = ax² を y 方向に ${q > 0 ? q + ' だけ上' : Math.abs(q) + ' だけ下'}へ平行移動`);
      lines.push(`  / Vertical shift of y = ax² by ${q}`);
      lines.push(`・a = ${a} ${a > 0 ? '→ 下に凸' : '→ 上に凸'}`);
      break;
    case 'axp2':
      lines.push(`・頂点は (${p}, 0) / Vertex at (${p}, 0)`);
      lines.push(`・y = ax² を x 方向に ${p > 0 ? p + ' だけ右' : Math.abs(p) + ' だけ左'}へ平行移動`);
      lines.push(`  / Horizontal shift of y = ax² by ${p}`);
      lines.push(`・a = ${a} ${a > 0 ? '→ 下に凸' : '→ 上に凸'}`);
      lines.push(`・注意: (x − p) の p の符号 / Watch the sign inside (x − p)`);
      break;
    case 'axp2q':
      lines.push(`・頂点は (${p}, ${q}) / Vertex at (${p}, ${q})`);
      lines.push(`・y = ax² を x 方向に ${p}、y 方向に ${q} 平行移動`);
      lines.push(`  / Shift y = ax² by (${p}, ${q})`);
      lines.push(`・a = ${a} ${a > 0 ? '→ 下に凸' : '→ 上に凸'}`);
      lines.push(`・符号に注意: p と q の両方 / Check signs of both p and q`);
      break;
    case 'kx':
      lines.push(`・漸近線: x = 0（y軸）, y = 0（x軸）/ Asymptotes: x=0, y=0`);
      lines.push(`・k = ${k} ${k > 0 ? '→ 第1・第3象限 / quadrants I & III' : '→ 第2・第4象限 / quadrants II & IV'}`);
      lines.push(`・|k| が大きいほど原点から離れる / larger |k| → farther from origin`);
      lines.push(`・定義域: x ≠ 0 / Domain: x ≠ 0`);
      if (Math.abs(k) >= 1) {
        lines.push(`・例: x = 1 → y = ${k}, x = ${k > 0 ? k : -Math.abs(k)} → y = ${k > 0 ? 1 : -1}（整数点）`);
      }
      break;
    case 'kxp':
      lines.push(`・漸近線: x = ${p}, y = 0 / Asymptotes: x = ${p}, y = 0`);
      lines.push(`・y = k/x を x 方向に ${p} 平行移動 / Horizontal shift of y = k/x by ${p}`);
      lines.push(`・k = ${k} ${k > 0 ? '（同符号象限側）' : '（異符号象限側）'}`);
      lines.push(`・定義域: x ≠ ${p} / Domain: x ≠ ${p}`);
      lines.push(`・注意: 分母 (x − p) の p の符号 / Watch the sign of p in (x − p)`);
      break;
    case 'kxpq':
      lines.push(`・漸近線: x = ${p}, y = ${q} / Asymptotes: x = ${p}, y = ${q}`);
      lines.push(`・y = k/x を点 (${p}, ${q}) へ平行移動 / Shift of y = k/x to center (${p}, ${q})`);
      lines.push(`・標準形: y − (${q}) = ${k}/(x − (${p}))`);
      lines.push(`・k = ${k}`);
      lines.push(`・定義域: x ≠ ${p} / Domain: x ≠ ${p}`);
      lines.push(`・p と q の符号・入れ替えに注意 / Watch signs and swap of p, q`);
      break;
  }

  return lines.join('\n');
}

/* ========== Problem generation ========== */
function makeProblem() {
  let correctParams = null;
  let distractors = [];
  let signature = '';

  for (let attempt = 0; attempt < 30; attempt++) {
    correctParams = genParams(currentForm);
    distractors = genDistractors(currentForm, correctParams);
    if (distractors.length < 2) continue;

    signature = `${currentType}|${currentForm}|${currentMode}|${paramsKey(correctParams)}`;
    if (signature === lastSignature) continue;

    // グラフが視野内で識別できるか軽くチェック
    const pts = samplePoints(currentForm, correctParams, 3);
    if (currentForm.startsWith('k') && pts.length < 2) continue;
    break;
  }

  const wrongTwo = shuffle(distractors).slice(0, 2);
  const optionsParams = shuffle([correctParams, ...wrongTwo]);
  const correctIndex = optionsParams.findIndex(
    (p) => paramsKey(p) === paramsKey(correctParams)
  );

  lastSignature = signature;

  return {
    form: currentForm,
    type: currentType,
    mode: currentMode,
    correctParams,
    optionsParams,
    correctIndex,
    explanation: buildExplanation(currentForm, correctParams, currentMode)
  };
}

/* ========== Render ========== */
function renderFormMenu() {
  const forms = FORM_OPTIONS[currentType];
  formMenu.innerHTML = forms
    .map(
      (f) =>
        `<button type="button" class="chip${f.id === currentForm ? ' active' : ''}" data-form="${f.id}" role="tab" aria-selected="${f.id === currentForm ? 'true' : 'false'}">${f.labelJa} / ${f.labelEn}</button>`
    )
    .join('');
}

function applyModeUI() {
  const typeMeta = TYPE_META[currentType];
  const formMeta = FORM_OPTIONS[currentType].find((f) => f.id === currentForm);
  const modeMeta = MODE_META[currentMode];

  subTitle.textContent = `${typeMeta.labelJa} · ${formMeta.labelJa} · ${modeMeta.labelJa} / ${typeMeta.labelEn} · ${formMeta.labelEn} · ${modeMeta.labelEn}`;
  document.title = 'グラフ関数ドリル / Graph Function Drill';

  typeMenu.querySelectorAll('.chip').forEach((btn) => {
    const active = btn.dataset.type === currentType;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  renderFormMenu();

  modeMenu.querySelectorAll('.chip').forEach((btn) => {
    const active = btn.dataset.mode === currentMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function renderQuestion(problem) {
  const { mode, form, correctParams, optionsParams } = problem;
  questionArea.innerHTML = '';
  choicesEl.innerHTML = '';
  choicesEl.className = 'choices';

  if (mode === 'g2f') {
    // グラフを見て式を選ぶ
    const prompt = document.createElement('p');
    prompt.className = 'question-prompt';
    prompt.textContent =
      'このグラフに対応する式はどれ？ / Which formula matches this graph?';
    questionArea.appendChild(prompt);

    const frame = document.createElement('div');
    frame.className = 'graph-frame';
    frame.innerHTML = buildGraphSvg(form, correctParams, {
      size: 340,
      showPoints: true,
      showAsymptotes: true,
      compact: false
    });
    questionArea.appendChild(frame);

    inputHint.textContent =
      '座標（整数点）と漸近線をヒントに、式と定義域を選んでください / Use integer points and asymptotes as hints.';

    optionsParams.forEach((params, i) => {
      const fmt = formatFormula(form, params, true);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.dataset.index = String(i);
      btn.innerHTML = `
        <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
        <span class="choice-content">
          ${fmt.main}
          <span class="domain">定義域 / domain: ${fmt.domain.ja}</span>
        </span>
      `;
      choicesEl.appendChild(btn);
    });
  } else {
    // 式を見てグラフを選ぶ
    const prompt = document.createElement('p');
    prompt.className = 'question-prompt';
    prompt.textContent =
      'この式に対応するグラフはどれ？ / Which graph matches this formula?';
    questionArea.appendChild(prompt);

    const fmt = formatFormula(form, correctParams, true);
    const formulaBox = document.createElement('div');
    formulaBox.className = 'formula-display';
    formulaBox.innerHTML = `${fmt.main}<span class="domain">定義域 / domain: ${fmt.domain.ja}</span>`;
    questionArea.appendChild(formulaBox);

    inputHint.textContent =
      '傾き・頂点・漸近線・開く向きなどに注意 / Watch slope, vertex, asymptotes, and opening direction.';

    choicesEl.classList.add('choices-graph');

    optionsParams.forEach((params, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn choice-graph';
      btn.dataset.index = String(i);
      btn.innerHTML = `
        <div class="choice-header">
          <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
          <span class="choice-content">選択肢 / Option ${String.fromCharCode(65 + i)}</span>
        </div>
        <div class="graph-choice-preview">
          ${buildGraphSvg(form, params, {
            size: 280,
            showPoints: true,
            showAsymptotes: true,
            compact: true
          })}
        </div>
      `;
      choicesEl.appendChild(btn);
    });
  }
}

function clearFeedback() {
  feedbackTextEl.textContent = '';
  explanationEl.textContent = '';
  explanationEl.hidden = true;
  feedbackEl.className = 'feedback empty';
  nextProblemBtn.hidden = true;
}

function newProblem() {
  locked = false;
  clearFeedback();
  currentProblem = makeProblem();
  renderQuestion(currentProblem);
}

function updateScoreboard() {
  correctCountEl.textContent = correctCount;
  wrongCountEl.textContent = wrongCount;
  streakCountEl.textContent = streak;
}

function selectChoice(index) {
  if (locked || !currentProblem) return;
  locked = true;

  const { correctIndex, explanation, form, correctParams, mode } = currentProblem;
  const buttons = choicesEl.querySelectorAll('.choice-btn');
  const isCorrect = index === correctIndex;
  const answerFmt = formatFormula(form, correctParams, true);

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    const iNum = Number(btn.dataset.index);
    if (iNum === correctIndex) {
      btn.classList.add('is-correct');
    } else if (iNum === index && !isCorrect) {
      btn.classList.add('is-wrong');
    } else {
      btn.classList.add('is-dimmed');
    }
  });

  if (isCorrect) {
    correctCount += 1;
    streak += 1;
    feedbackEl.className = 'feedback ok';
    feedbackTextEl.textContent = `正解！ Correct!  → ${answerFmt.main}`;
  } else {
    wrongCount += 1;
    streak = 0;
    feedbackEl.className = 'feedback ng';
    feedbackTextEl.textContent = `不正解… Incorrect... 正解は / Answer: ${answerFmt.main}`;
  }

  explanationEl.textContent = explanation;
  explanationEl.hidden = false;
  nextProblemBtn.hidden = false;
  updateScoreboard();

  setTimeout(() => {
    nextProblemBtn.focus();
  }, 50);
}

/* ========== Mode setters ========== */
function setType(type) {
  if (!TYPE_META[type]) return;
  if (type === currentType) return;
  currentType = type;
  currentForm = FORM_OPTIONS[type][0].id;
  applyModeUI();
  newProblem();
}

function setForm(form) {
  const allowed = FORM_OPTIONS[currentType].some((f) => f.id === form);
  if (!allowed) return;
  if (form === currentForm) return;
  currentForm = form;
  applyModeUI();
  newProblem();
}

function setMode(mode) {
  if (!MODE_META[mode]) return;
  if (mode === currentMode) return;
  currentMode = mode;
  applyModeUI();
  newProblem();
}

/* ========== Events ========== */
typeMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn || btn.disabled) return;
  setType(btn.dataset.type);
});

formMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn || btn.disabled) return;
  setForm(btn.dataset.form);
});

modeMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn || btn.disabled) return;
  setMode(btn.dataset.mode);
});

choicesEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.choice-btn');
  if (!btn || btn.disabled || locked) return;
  selectChoice(Number(btn.dataset.index));
});

nextProblemBtn.addEventListener('click', () => {
  newProblem();
});

resetBtn.addEventListener('click', () => {
  correctCount = 0;
  wrongCount = 0;
  streak = 0;
  updateScoreboard();
  newProblem();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && locked && !nextProblemBtn.hidden) {
    e.preventDefault();
    nextProblemBtn.click();
    return;
  }

  if (locked) return;

  // 1/2/3 or A/B/C で選択
  const map = {
    '1': 0, '2': 1, '3': 2,
    a: 0, b: 1, c: 2,
    A: 0, B: 1, C: 2
  };
  if (e.key in map) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    selectChoice(map[e.key]);
  }
});

/* ========== Init ========== */
applyModeUI();
updateScoreboard();
newProblem();
