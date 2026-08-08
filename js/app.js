/**
 * Graph & Function Reading Practice
 */

// HTMLの <html lang="..."> から言語を自動判定
const isJa = document.documentElement.lang !== 'en';

const TXT = {
  title: isJa ? '直線・放物線・双曲線関数 読み取り練習サイト' : 'Linear, Parabola, & Hyperbola Reading Practice',
  g2fPrompt: isJa ? 'このグラフに対応する式はどれ？' : 'Which formula matches this graph?',
  f2gPrompt: isJa ? 'この式に対応するグラフはどれ？' : 'Which graph matches this formula?',
  keyPoints: isJa ? '特徴となる点' : 'Key Points',
  domain: isJa ? '定義域: ' : 'Domain: ',
  vertex: isJa ? '頂点: ' : 'Vertex: ',
  yInt: isJa ? 'y切片: ' : 'y-intercept: ',
  xInt: isJa ? 'x切片: ' : 'x-intercepts: ',
  asymptotes: isJa ? '漸近線: ' : 'Asymptotes: ',
  passingPoint: isJa ? '通る点: ' : 'Passing point: ',
  correct: isJa ? '正解' : 'Correct',
  incorrect: isJa ? '不正解' : 'Incorrect',
  seeExpl: isJa ? '解説は以下をご覧ください。' : 'Please see the explanation below.',
  nextBtn: isJa ? '次へ (Enter) ⏎' : 'Next (Enter) ⏎',
  ansTitleCorrect: isJa ? '正解！' : 'Correct!',
  ansTitleWrong: isJa ? '不正解... 正解は:' : 'Incorrect... Answer:',
  choiceLabel: isJa ? '選択肢' : 'Choice',
  ansLabel: isJa ? '【答え】' : '[Answer]',
  formulaLabel: isJa ? '【問題の式】' : '[Formula]',
  explLabel: isJa ? '【解説】' : '[Explanation]'
};

const TYPE_META = {
  linear: { labelJa: '直線', labelEn: 'Linear' },
  parabola: { labelJa: '放物線', labelEn: 'Parabola' },
  hyperbola: { labelJa: '双曲線', labelEn: 'Hyperbola' }
};

const MODE_META = {
  g2f: { labelJa: 'グラフ→式', labelEn: 'Graph → Formula' },
  f2g: { labelJa: '式→グラフ', labelEn: 'Formula → Graph' }
};

const FORM_OPTIONS = {
  linear: [
    { id: 'ax', tex: 'y = ax' },
    { id: 'axb', tex: 'y = ax + b' }
  ],
  parabola: [
    { id: 'ax2', tex: 'y = ax^{2}' },
    { id: 'ax2q', tex: 'y = ax^{2} + q' },
    { id: 'axp2', tex: 'y = a(x - p)^{2}' },
    { id: 'axp2q', tex: 'y = a(x - p)^{2} + q' }
  ],
  hyperbola: [
    { id: 'kx', tex: 'y = \\dfrac{k}{x}' },
    { id: 'kxp', tex: 'y = \\dfrac{k}{x - p}' },
    { id: 'kxpq', tex: 'y = \\dfrac{k}{x - p} + q' }
  ]
};

/* ========== DOM ========== */
const typeMenu = document.getElementById('typeMenu');
const formMenu = document.getElementById('formMenu');
const modeMenu = document.getElementById('modeMenu');
const questionArea = document.getElementById('questionArea');
const explanationEl = document.getElementById('explanation');
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

function paramsKey(params) {
  const sorted = {};
  Object.keys(params).sort().forEach(k => { sorted[k] = params[k]; });
  return JSON.stringify(sorted);
}

function paren(n) {
  return n < 0 ? `(${n})` : `${n}`;
}

function latexNum(n) {
  if (n < 0) return `-${Math.abs(n)}`;
  return String(n);
}

function latexCoeff(n, body) {
  if (n === 1) return body;
  if (n === -1) return `-${body}`;
  return `${latexNum(n)}${body}`;
}

function formatCoeff(c, variable) {
  if (c === 1) return variable;
  if (c === -1) return `-${variable}`;
  return `${c}${variable}`;
}

function latexSigned(n) {
  if (n >= 0) return `+ ${n}`;
  return `- ${Math.abs(n)}`;
}

function renderKatex(tex, displayMode = false) {
  if (typeof katex === 'undefined') {
    return `<span class="tex-fallback">${tex}</span>`;
  }
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      strict: 'ignore'
    });
  } catch {
    return `<span class="tex-fallback">${tex}</span>`;
  }
}

function renderKatexIn(el) {
  if (!el || typeof katex === 'undefined') return;
  el.querySelectorAll('.tex').forEach((node) => {
    const tex = node.getAttribute('data-tex') || node.textContent;
    const display = node.getAttribute('data-display') === 'true';
    node.innerHTML = renderKatex(tex, display);
  });
}

/* ========== Math ========== */
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
    return { text: 'x \\neq 0', exclude: [0] };
  }
  if (form === 'kxp' || form === 'kxpq') {
    const p = params.p;
    return {
      text: `x \\neq ${latexNum(p)}`,
      exclude: [p]
    };
  }
  return { text: isJa ? '\\text{すべての実数}' : '\\text{all real numbers}', exclude: [] };
}

function asymptotesOf(form, params) {
  if (form === 'kx') return [{ type: 'v', value: 0 }, { type: 'h', value: 0 }];
  if (form === 'kxp') return [{ type: 'v', value: params.p }, { type: 'h', value: 0 }];
  if (form === 'kxpq') return [{ type: 'v', value: params.p }, { type: 'h', value: params.q }];
  return [];
}

function formulaTex(form, params) {
  const { a, b, p, q, k } = params;
  switch (form) {
    case 'ax': return `y = ${latexCoeff(a, 'x')}`;
    case 'axb':
      if (b === 0) return `y = ${latexCoeff(a, 'x')}`;
      return `y = ${latexCoeff(a, 'x')} ${latexSigned(b)}`;
    case 'ax2': return `y = ${latexCoeff(a, 'x^{2}')}`;
    case 'ax2q':
      if (q === 0) return `y = ${latexCoeff(a, 'x^{2}')}`;
      return `y = ${latexCoeff(a, 'x^{2}')} ${latexSigned(q)}`;
    case 'axp2': {
      const inner = p === 0 ? 'x' : `(x ${latexSigned(-p)})`;
      const body = p === 0 ? 'x^{2}' : `${inner}^{2}`;
      return `y = ${latexCoeff(a, body)}`;
    }
    case 'axp2q': {
      const inner = p === 0 ? 'x' : `(x ${latexSigned(-p)})`;
      const body = p === 0 ? 'x^{2}' : `${inner}^{2}`;
      const left = latexCoeff(a, body);
      if (q === 0) return `y = ${left}`;
      return `y = ${left} ${latexSigned(q)}`;
    }
    case 'kx': {
      const sign = k < 0 ? '-' : '';
      return `y = ${sign}\\dfrac{${Math.abs(k)}}{x}`;
    }
    case 'kxp': {
      const sign = k < 0 ? '-' : '';
      const den = p === 0 ? 'x' : `x ${latexSigned(-p)}`;
      return `y = ${sign}\\dfrac{${Math.abs(k)}}{${den}}`;
    }
    case 'kxpq': {
      const sign = k < 0 ? '-' : '';
      const den = p === 0 ? 'x' : `x ${latexSigned(-p)}`;
      const qStr = q > 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
      if (q === 0) return `y = ${sign}\\dfrac{${Math.abs(k)}}{${den}}`;
      return `y = ${sign}\\dfrac{${Math.abs(k)}}{${den}} ${qStr}`;
    }
    default:
      return 'y = ?';
  }
}

function formulaHtml(form, params, withDomain = true) {
  const tex = formulaTex(form, params);
  const main = renderKatex(tex);
  if (!withDomain) return { tex, main, domain: null, html: main };
  const dom = domainOf(form, params);
  const domainHtml = `<span class="domain">${TXT.domain}${renderKatex(dom.text)}</span>`;
  return { tex, main, domain: dom, html: main + domainHtml };
}

/* ========== Features for annotations ========== */
function isInt(n) {
  return Number.isFinite(n) && Math.abs(n - Math.round(n)) < 1e-9;
}

function getGraphFeatures(form, params) {
  const features = {
    vertex: null,
    yIntercept: null,
    xIntercepts: [],
    asymptotes: asymptotesOf(form, params)
  };

  const { a, b, p, q } = params;

  if (!domainOf(form, params).exclude.includes(0)) {
    const y0 = evalFn(form, params, 0);
    if (isInt(y0) && Math.abs(y0) <= 6) {
      features.yIntercept = { x: 0, y: Math.round(y0) };
    }
  }

  switch (form) {
    case 'ax':
      features.yIntercept = { x: 0, y: 0 };
      if (a !== 0) features.xIntercepts.push({ x: 0, y: 0 });
      break;
    case 'axb':
      features.yIntercept = { x: 0, y: b };
      if (a !== 0 && isInt(-b / a)) {
        features.xIntercepts.push({ x: Math.round(-b / a), y: 0 });
      }
      break;
    case 'ax2':
      features.vertex = { x: 0, y: 0 };
      features.yIntercept = { x: 0, y: 0 };
      features.xIntercepts.push({ x: 0, y: 0 });
      break;
    case 'ax2q':
      features.vertex = { x: 0, y: q };
      features.yIntercept = { x: 0, y: q };
      if (a !== 0 && q / a <= 0 && isInt(Math.sqrt(-q / a))) {
        const t = Math.round(Math.sqrt(-q / a));
        features.xIntercepts.push({ x: t, y: 0 }, { x: -t, y: 0 });
      }
      break;
    case 'axp2':
      features.vertex = { x: p, y: 0 };
      features.xIntercepts.push({ x: p, y: 0 });
      if (!domainOf(form, params).exclude.includes(0)) {
        const y0 = a * p * p;
        if (isInt(y0) && Math.abs(y0) <= 6) features.yIntercept = { x: 0, y: Math.round(y0) };
      }
      break;
    case 'axp2q':
      features.vertex = { x: p, y: q };
      if (!domainOf(form, params).exclude.includes(0)) {
        const y0 = a * p * p + q;
        if (isInt(y0) && Math.abs(y0) <= 6) features.yIntercept = { x: 0, y: Math.round(y0) };
      }
      break;
  }
  return features;
}

function featuresCaptionHtml(form, params, primaryPoint) {
  const f = getGraphFeatures(form, params);
  const lines = [];

  if (f.vertex) {
    lines.push(`${TXT.vertex}${renderKatex(`(${f.vertex.x},\\, ${f.vertex.y})`)}`);
  }

  if (f.yIntercept) {
    const isSameAsVertex = f.vertex && f.vertex.x === f.yIntercept.x && f.vertex.y === f.yIntercept.y;
    if (!isSameAsVertex) {
      lines.push(`${TXT.yInt}${renderKatex(`(${f.yIntercept.x},\\, ${f.yIntercept.y})`)}`);
    }
  }

  const uniqueXInts = f.xIntercepts.filter(pt => {
    if (f.vertex && f.vertex.x === pt.x && f.vertex.y === pt.y) return false;
    return true;
  });
  if (uniqueXInts.length) {
    const xs = uniqueXInts.map((pt) => renderKatex(`(${pt.x},\\, 0)`)).join(', ');
    lines.push(`${TXT.xInt}${xs}`);
  }

  if (f.asymptotes.length) {
    const asy = f.asymptotes.map((a) => {
      if (a.type === 'v') return renderKatex(`x = ${a.value}`);
      return renderKatex(`y = ${a.value}`);
    }).join(', ');
    lines.push(`${TXT.asymptotes}${asy}`);
  }

  const special = new Set();
  if (f.vertex) special.add(`${f.vertex.x},${f.vertex.y}`);
  if (f.yIntercept) special.add(`${f.yIntercept.x},${f.yIntercept.y}`);
  f.xIntercepts.forEach((pt) => special.add(`${pt.x},${pt.y}`));
  
  if (primaryPoint && !special.has(`${primaryPoint.x},${primaryPoint.y}`)) {
    lines.push(`${TXT.passingPoint}${renderKatex(`(${primaryPoint.x},\\, ${primaryPoint.y})`)}`);
  }

  return lines.join('<br>');
}

/* ========== Parameter generation ========== */
const NONZERO = [-3, -2, -1, 1, 2, 3];
const SHIFT = [-3, -2, -1, 1, 2, 3];

function genParams(form) {
  switch (form) {
    case 'ax': return { a: pick(NONZERO) };
    case 'axb': return { a: pick(NONZERO), b: pick(SHIFT) };
    case 'ax2': return { a: pick(NONZERO) };
    case 'ax2q': return { a: pick(NONZERO), q: pick(SHIFT) };
    case 'axp2': return { a: pick(NONZERO), p: pick(SHIFT) };
    case 'axp2q': return { a: pick(NONZERO), p: pick(SHIFT), q: pick(SHIFT) };
    case 'kx': return { k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]) };
    case 'kxp': return { k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]), p: pick(SHIFT) };
    case 'kxpq': return { k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]), p: pick(SHIFT), q: pick(SHIFT) };
    default: return {};
  }
}

function genDistractors(form, correct) {
  const c = { ...correct };
  const candidates = [];

  const push = (obj) => {
    if (obj.a === 0 || obj.k === 0) return;
    if (paramsKey(obj) === paramsKey(c)) return;

    const pts = samplePoints(form, obj, 6);
    let hasNonVertex = false;
    if (form === 'ax' || form === 'axb' || form === 'ax2' || form === 'ax2q') {
      hasNonVertex = pts.some(p => p.x !== 0);
    } else if (form === 'axp2' || form === 'axp2q') {
      hasNonVertex = pts.some(p => p.x !== obj.p);
    } else {
      hasNonVertex = pts.length > 0;
    }
    
    if (!hasNonVertex) return;

    candidates.push(obj);
  };

  switch (form) {
    case 'ax':
      push({ a: -c.a });
      push({ a: c.a > 0 ? c.a + 1 : c.a - 1 });
      push({ a: c.a > 0 ? (c.a - 1 || 2) : (c.a + 1 || -2) });
      push({ a: c.a === 1 ? 3 : c.a === -1 ? -3 : c.a > 0 ? 1 : -1 });
      break;
    case 'axb':
      push({ a: -c.a, b: c.b });
      push({ a: c.a, b: -c.b });
      push({ a: -c.a, b: -c.b });
      push({ a: c.a, b: (c.b + (c.b > 0 ? -1 : 1)) || 2 });
      push({ a: (c.a + (c.a > 0 ? 1 : -1)) || 2, b: c.b });
      if (c.b !== 0 && Math.abs(c.b) <= 3) push({ a: c.b, b: c.a });
      break;
    case 'ax2':
      push({ a: -c.a });
      push({ a: c.a > 0 ? c.a + 1 : c.a - 1 });
      push({ a: c.a > 0 ? Math.max(1, c.a - 1) : Math.min(-1, c.a + 1) });
      break;
    case 'ax2q':
      push({ a: -c.a, q: c.q });
      push({ a: c.a, q: -c.q });
      push({ a: -c.a, q: -c.q });
      push({ a: c.a, q: (c.q + (c.q > 0 ? 1 : -1)) || 2 });
      push({ a: (c.a + (c.a > 0 ? 1 : -1)) || 2, q: c.q });
      break;
    case 'axp2':
      push({ a: -c.a, p: c.p });
      push({ a: c.a, p: -c.p });
      push({ a: -c.a, p: -c.p });
      push({ a: c.a, p: (c.p + (c.p > 0 ? 1 : -1)) || 2 });
      push({ a: (c.a + (c.a > 0 ? 1 : -1)) || 2, p: c.p });
      break;
    case 'axp2q':
      push({ a: -c.a, p: c.p, q: c.q });
      push({ a: c.a, p: -c.p, q: c.q });
      push({ a: c.a, p: c.p, q: -c.q });
      push({ a: c.a, p: -c.p, q: -c.q });
      push({ a: -c.a, p: c.p, q: -c.q });
      push({ a: c.a, p: (c.p + (c.p > 0 ? 1 : -1)) || 2, q: c.q });
      push({ a: c.a, p: c.p, q: (c.q + (c.q > 0 ? 1 : -1)) || 2 });
      break;
    case 'kx':
      push({ k: -c.k });
      push({ k: c.k > 0 ? c.k + 1 : c.k - 1 });
      push({ k: c.k > 0 ? Math.max(1, c.k - 1) : Math.min(-1, c.k + 1) });
      push({ k: c.k === 2 ? 4 : c.k === -2 ? -4 : c.k > 0 ? 2 : -2 });
      break;
    case 'kxp':
      push({ k: -c.k, p: c.p });
      push({ k: c.k, p: -c.p });
      push({ k: -c.k, p: -c.p });
      push({ k: (c.k + (c.k > 0 ? 1 : -1)) || 2, p: c.p });
      push({ k: c.k, p: (c.p + (c.p > 0 ? 1 : -1)) || 2 });
      break;
    case 'kxpq':
      push({ k: -c.k, p: c.p, q: c.q });
      push({ k: c.k, p: -c.p, q: c.q });
      push({ k: c.k, p: c.p, q: -c.q });
      push({ k: c.k, p: -c.p, q: -c.q });
      push({ k: -c.k, p: c.p, q: -c.q });
      push({ k: c.k, p: (c.p + (c.p > 0 ? 1 : -1)) || 2, q: c.q });
      push({ k: c.k, p: c.p, q: (c.q + (c.q > 0 ? 1 : -1)) || 2 });
      if (c.p !== c.q && c.q !== 0) push({ k: c.k, p: c.q, q: c.p });
      break;
  }

  let guard = 0;
  while (uniqueBy(candidates, paramsKey).length < 4 && guard < 40) {
    guard += 1;
    const d = { ...c };
    const key = pick(Object.keys(d));
    const delta = pick([-2, -1, 1, 2]);
    d[key] = d[key] + delta;
    if (d[key] === 0 && (key === 'a' || key === 'k')) d[key] = delta > 0 ? 1 : -1;
    push(d);
  }

  return uniqueBy(candidates, paramsKey).slice(0, 8);
}

/* ========== Sample points ========== */
function samplePoints(form, params, limit = 6) {
  const points = [];
  const exclude = new Set(domainOf(form, params).exclude);
  const range = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6];

  for (const x of range) {
    if (exclude.has(x)) continue;
    const y = evalFn(form, params, x);
    if (!Number.isFinite(y) || !isInt(y)) continue;
    const yi = Math.round(y);
    if (Math.abs(yi) > 6) continue;
    points.push({ x, y: yi });
    if (points.length >= limit) break;
  }

  if ((form === 'kx' || form === 'kxp' || form === 'kxpq') && points.length < 4) {
    const k = params.k;
    const p = params.p || 0;
    const q = params.q || 0;
    const divisors = [];
    for (let d = 1; d <= Math.abs(k); d++) {
      if (Math.abs(k) % d === 0) divisors.push(d, -d);
    }
    for (const t of shuffle(divisors)) {
      const x = t + p;
      if (exclude.has(x) || Math.abs(x) > 6) continue;
      const y = k / t + q;
      if (!isInt(y)) continue;
      const yi = Math.round(y);
      if (Math.abs(yi) > 6) continue;
      if (!points.some((pt) => pt.x === x && pt.y === yi)) points.push({ x, y: yi });
      if (points.length >= limit) break;
    }
  }

  return points.slice(0, limit);
}

/* ========== SVG Graph ========== */
const GRAPH_VIEW = { min: -6, max: 6, pad: 26 };

function worldToSvg(x, y, size = 320) {
  const { min, max, pad } = GRAPH_VIEW;
  const usable = size - pad * 2;
  const sx = pad + ((x - min) / (max - min)) * usable;
  const sy = pad + ((max - y) / (max - min)) * usable;
  return [sx, sy];
}

function boxesOverlap(a, b, pad = 2) {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

function placeLabel(candidates, occupied, size) {
  for (const c of candidates) {
    const box = {
      x: c.anchor === 'end' ? c.x - c.w : c.anchor === 'middle' ? c.x - c.w / 2 : c.x,
      y: c.y - c.h + 2,
      w: c.w,
      h: c.h
    };
    if (box.x < 2 || box.y < 2 || box.x + box.w > size - 2 || box.y + box.h > size - 2) continue;
    const overlaps = occupied.filter((o) => boxesOverlap(box, o));
    if (overlaps.length === 0) {
      occupied.push(box);
      return c;
    }
  }
  for (const c of candidates) {
    const box = {
      x: c.anchor === 'end' ? c.x - c.w : c.anchor === 'middle' ? c.x - c.w / 2 : c.x,
      y: c.y - c.h + 2,
      w: c.w,
      h: c.h
    };
    if (box.x < 2 || box.y < 2 || box.x + box.w > size - 2 || box.y + box.h > size - 2) continue;
    const majorObstacles = occupied.filter(o => o.w >= 10 && o.h >= 10);
    const overlaps = majorObstacles.filter((o) => boxesOverlap(box, o));
    if (overlaps.length === 0) {
      occupied.push(box);
      return c;
    }
  }
  return candidates[0];
}

function estimateTextWidth(text, fontSize) {
  return Math.max(12, text.length * fontSize * 0.62);
}

function buildGraphSvg(form, params, opts = {}) {
  const { size = 320, primaryPoint = null, showAsymptotes = true, showLabels = true, compact = false } = opts;
  const { min, max, pad } = GRAPH_VIEW;
  const occupied = [];
  const parts = [];

  parts.push(`<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="graph">`);
  parts.push(`<rect width="${size}" height="${size}" fill="#ffffff"/>`);

  for (let i = min; i <= max; i++) {
    if (i === 0) continue;
    const [gx] = worldToSvg(i, 0, size);
    const [, gy] = worldToSvg(0, i, size);
    parts.push(`<line x1="${gx}" y1="${pad}" x2="${gx}" y2="${size - pad}" stroke="#dae8e3" stroke-width="1"/>`);
    parts.push(`<line x1="${pad}" y1="${gy}" x2="${size - pad}" y2="${gy}" stroke="#dae8e3" stroke-width="1"/>`);
  }

  const [ox, oy] = worldToSvg(0, 0, size);
  parts.push(`<line x1="${pad}" y1="${oy}" x2="${size - pad}" y2="${oy}" stroke="#333" stroke-width="1.6"/>`);
  parts.push(`<line x1="${ox}" y1="${pad}" x2="${ox}" y2="${size - pad}" stroke="#333" stroke-width="1.6"/>`);
  parts.push(`<polygon points="${size - pad},${oy} ${size - pad - 7},${oy - 4} ${size - pad - 7},${oy + 4}" fill="#333"/>`);
  parts.push(`<polygon points="${ox},${pad} ${ox - 4},${pad + 7} ${ox + 4},${pad + 7}" fill="#333"/>`);

  if (!compact) {
    parts.push(`<text x="${size - pad - 2}" y="${oy - 8}" font-size="15" font-weight="700" fill="#333" text-anchor="end">x</text>`);
    parts.push(`<text x="${ox + 8}" y="${pad + 12}" font-size="15" font-weight="700" fill="#333">y</text>`);
    for (let i = min; i <= max; i++) {
      if (i === 0) continue;
      const [tx] = worldToSvg(i, 0, size);
      const [, ty] = worldToSvg(0, i, size);
      parts.push(`<text x="${tx}" y="${oy + 18}" font-size="14" fill="#555" text-anchor="middle">${i}</text>`);
      parts.push(`<text x="${ox - 6}" y="${ty + 4}" font-size="14" fill="#555" text-anchor="end">${i}</text>`);
      parts.push(`<line x1="${tx}" y1="${oy - 3}" x2="${tx}" y2="${oy + 3}" stroke="#333" stroke-width="1"/>`);
      parts.push(`<line x1="${ox - 3}" y1="${ty}" x2="${ox + 3}" y2="${ty}" stroke="#333" stroke-width="1"/>`);
      occupied.push({ x: tx - 8, y: oy + 4, w: 18, h: 14 });
      occupied.push({ x: ox - 24, y: ty - 7, w: 18, h: 14 });
    }
  } else {
    for (let i = min; i <= max; i += 2) {
      if (i === 0) continue;
      const [tx] = worldToSvg(i, 0, size);
      const [, ty] = worldToSvg(0, i, size);
      parts.push(`<text x="${tx}" y="${oy + 16}" font-size="14" fill="#444" text-anchor="middle">${i}</text>`);
      parts.push(`<text x="${ox - 5}" y="${ty + 5}" font-size="14" fill="#444" text-anchor="end">${i}</text>`);
    }
  }

  if (showAsymptotes) {
    const asy = asymptotesOf(form, params);
    for (const a of asy) {
      if (a.type === 'v') {
        if (a.value < min || a.value > max) continue;
        const [ax] = worldToSvg(a.value, 0, size);
        parts.push(`<line x1="${ax}" y1="${pad}" x2="${ax}" y2="${size - pad}" stroke="#c83025" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>`);
        occupied.push({ x: ax - 3, y: pad, w: 6, h: size - 2 * pad });
      } else {
        if (a.value < min || a.value > max) continue;
        const [, ay] = worldToSvg(0, a.value, size);
        parts.push(`<line x1="${pad}" y1="${ay}" x2="${size - pad}" y2="${ay}" stroke="#c83025" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>`);
        occupied.push({ x: pad, y: ay - 3, w: size - 2 * pad, h: 6 });
      }
    }
  }

  const exclude = domainOf(form, params).exclude;
  const isHyperbola = form === 'kx' || form === 'kxp' || form === 'kxpq';

  function buildPath(xStart, xEnd, step) {
    const pts = [];
    let penUp = true;
    for (let x = xStart; x <= xEnd + 1e-9; x += step) {
      let nearAsy = false;
      for (const ex of exclude) {
        if (Math.abs(x - ex) < 0.08) nearAsy = true;
      }
      if (nearAsy) {
        penUp = true;
        continue;
      }
      const y = evalFn(form, params, x);
      if (!Number.isFinite(y) || Math.abs(y) > 20 || y < min - 1 || y > max + 1) {
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
      if (showLabels) {
        occupied.push({ x: sx - 4, y: sy - 4, w: 8, h: 8 });
      }
    }
    return pts.join(' ');
  }

  const step = isHyperbola ? 0.04 : 0.06;
  if (isHyperbola && exclude.length) {
    const ex = exclude[0];
    const left = buildPath(min, ex - 0.12, step);
    const right = buildPath(ex + 0.12, max, step);
    if (left) parts.push(`<path d="${left}" fill="none" stroke="#1a5c78" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (right) parts.push(`<path d="${right}" fill="none" stroke="#1a5c78" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  } else {
    const d = buildPath(min, max, step);
    if (d) parts.push(`<path d="${d}" fill="none" stroke="#1a5c78" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  const features = getGraphFeatures(form, params);
  const pts = [];
  if (features.vertex) pts.push({ ...features.vertex, primary: true });
  if (features.yIntercept) pts.push({ ...features.yIntercept, primary: true });
  features.xIntercepts.forEach((pt) => pts.push({ ...pt, primary: true }));
  if (primaryPoint) pts.push({ ...primaryPoint, primary: true });

  const seen = new Set();
  const uniquePts = [];
  for (const pt of pts) {
    const key = `${pt.x},${pt.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniquePts.push(pt);
  }

  for (const pt of uniquePts) {
    if (pt.x < min || pt.x > max || pt.y < min || pt.y > max) continue;
    const [sx, sy] = worldToSvg(pt.x, pt.y, size);
    const r = compact ? 4 : 5;
    parts.push(`<circle cx="${sx}" cy="${sy}" r="${r}" fill="#c83025" stroke="#fff" stroke-width="1.5"/>`);
    occupied.push({ x: sx - r - 1, y: sy - r - 1, w: 2 * r + 2, h: 2 * r + 2 });

    if (showLabels && pt.primary) {
      const label = `(${pt.x}, ${pt.y})`;
      const fs = 14;
      const w = estimateTextWidth(label, fs);
      const h = fs + 2;
      const placed = placeLabel(
        [
          { x: sx + 7, y: sy - 8, w, h, anchor: 'start' },
          { x: sx - 7, y: sy - 8, w, h, anchor: 'end' },
          { x: sx + 7, y: sy + 14, w, h, anchor: 'start' },
          { x: sx - 7, y: sy + 14, w, h, anchor: 'end' },
          { x: sx, y: sy - 12, w, h, anchor: 'middle' },
          { x: sx, y: sy + 16, w, h, anchor: 'middle' }
        ],
        occupied,
        size
      );
      parts.push(`<text x="${placed.x}" y="${placed.y}" font-size="${fs}" font-weight="900" fill="#c83025" text-anchor="${placed.anchor}">${label}</text>`);
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

/* ========== Explanations ========== */

function pickPrimaryPoint(form, params) {
  const pts = samplePoints(form, params, 6);
  if (form === 'ax' || form === 'axb' || form === 'ax2' || form === 'ax2q') {
    return pts.find(p => p.x !== 0) || pts[0];
  } else if (form === 'axp2' || form === 'axp2q') {
    return pts.find(p => p.x !== params.p) || pts[0];
  }
  return pts[0];
}

function buildExplanation(form, params, mode, pt, correctIndex) {
  const tex = formulaTex(form, params);
  const { a, b, p, q, k } = params;
  const ja = [];
  const en = [];

  if (mode === 'g2f') {
    switch (form) {
      case 'ax': {
        ja.push(`原点 $(0, 0)$ を通る直線なので、$y = ax$ と置けます。`);
        en.push(`Since it is a line passing through the origin $(0, 0)$, it can be written as $y = ax$.`);
        
        ja.push(`グラフを見ると、通る点として $(${pt.x}, ${pt.y})$ が読み取れます。`);
        en.push(`From the graph, we can read the passing point $(${pt.x}, ${pt.y})$.`);
        
        ja.push(`式に $x = ${pt.x}, y = ${pt.y}$ を代入して $a$ を求めます：<br> $${pt.y} = ${formatCoeff(pt.x, 'a')}$ 　より　 $a = ${a}$`);
        en.push(`Substitute $x = ${pt.x}$ and $y = ${pt.y}$ to find $a$:<br> $${pt.y} = ${formatCoeff(pt.x, 'a')} \\implies a = ${a}$`);

        ja.push(`（傾き $a = ${a}$ が${a > 0 ? '正なので右上がり' : '負なので右下がり'}の直線になっています）`);
        en.push(`(The slope $a = ${a}$ is ${a > 0 ? 'positive, so the line rises to the right' : 'negative, so the line falls to the right'}.)`);

        ja.push(`（別解）グラフ上の点 $(0, 0)$ と 点 $(${pt.x}, ${pt.y})$ を用いて傾き $a$ を求めます。`);
        en.push(`(Alternative) Find the slope $a$ using the origin $(0, 0)$ and point $(${pt.x}, ${pt.y})$.`);

        ja.push(`傾き $a$ は「$y$の増加量 $\\div$ $x$の増加量」なので、<br> $a = \\dfrac{${pt.y} - 0}{${pt.x} - 0} = \\dfrac{${pt.y}}{${pt.x}} = ${a}$ 　と計算できます。`);
        en.push(`The slope $a$ is (change in y) $\\div$ (change in x), so:<br> $a = \\dfrac{${pt.y} - 0}{${pt.x} - 0} = \\dfrac{${pt.y}}{${pt.x}} = ${a}$.`);
        break;
      }
      case 'axb': {
        ja.push(`一般に、直線は $y = ax + b$ と置けます。`);
        en.push(`Generally, a line can be written as $y = ax + b$.`);

        ja.push(`$y$切片 $b$ は、グラフが$y$軸と交わる点の$y$座標です。グラフを見ると点 $(0, ${b})$ で交わっているので $b = ${b}$ です。`);
        en.push(`The y-intercept $b$ is ${b} since the graph intersects the y-axis at $(0, ${b})$.`);

        ja.push(`$y = ax ${latexSigned(b)}$ に、読み取れる通る点 $(${pt.x}, ${pt.y})$ を代入して $a$ を求めます：`);
        en.push(`Substitute the point $(${pt.x}, ${pt.y})$ into $y = ax ${latexSigned(b)}$ to find $a$:`);
        
        const left = pt.y - b;
        ja.push(`$${pt.y} = ${formatCoeff(pt.x, 'a')} ${latexSigned(b)}$ 　より　 $${left} = ${formatCoeff(pt.x, 'a')}$ 　となるので　 $a = ${a}$`);
        en.push(`$${pt.y} = ${formatCoeff(pt.x, 'a')} ${latexSigned(b)} \\implies ${left} = ${formatCoeff(pt.x, 'a')} \\implies a = ${a}$`);

        const pA = 0 < pt.x ? {x:0, y:b} : pt;
        const pB = 0 < pt.x ? pt : {x:0, y:b};
        const dx2 = pB.x - pA.x;
        const dy2 = pB.y - pA.y;
        ja.push(`（別解）グラフ上の点 $(${pA.x}, ${pA.y})$ と 点 $(${pB.x}, ${pB.y})$ を用いて傾きを求めます。`);
        en.push(`(Alternative) Find the slope using points $(${pA.x}, ${pA.y})$ and $(${pB.x}, ${pB.y})$.`);

        ja.push(`傾き $a$ は「$y$の増加量 $\\div$ $x$の増加量」なので、<br> $a = \\dfrac{${pB.y} - ${paren(pA.y)}}{${pB.x} - ${paren(pA.x)}} = \\dfrac{${dy2}}{${dx2}} = ${a}$ 　と計算できます。`);
        en.push(`The slope $a$ is (change in y) $\\div$ (change in x), so:<br> $a = \\dfrac{${pB.y} - ${paren(pA.y)}}{${pB.x} - ${paren(pA.x)}} = \\dfrac{${dy2}}{${dx2}} = ${a}$.`);
        break;
      }
      case 'ax2': {
        ja.push(`一般に、二次関数 $y = ax^2$ （頂点が原点）と置けます。`);
        en.push(`Generally, a quadratic function with its vertex at the origin is $y = ax^2$.`);

        ja.push(`グラフを見ると、通る点として $(${pt.x}, ${pt.y})$ が読み取れます。`);
        en.push(`From the graph, we can read the passing point $(${pt.x}, ${pt.y})$.`);

        ja.push(`$y = ax^2$ に $x = ${pt.x}, y = ${pt.y}$ を代入して $a$ を求めます：`);
        en.push(`Substitute $x = ${pt.x}$ and $y = ${pt.y}$ to find $a$:`);

        ja.push(`$${pt.y} = a \\times ${paren(pt.x)}^2$ 　より　 $${pt.y} = ${formatCoeff(pt.x * pt.x, 'a')}$ 　となるので　 $a = ${a}$`);
        en.push(`$${pt.y} = a \\times ${paren(pt.x)}^2 \\implies ${pt.y} = ${formatCoeff(pt.x * pt.x, 'a')} \\implies a = ${a}$`);

        ja.push(`（$a = ${a}$ が${a > 0 ? '正なので下に凸' : '負なので上に凸'}のグラフです）`);
        en.push(`(Since $a = ${a}$ is ${a > 0 ? 'positive, it is convex downward' : 'negative, it is convex upward'}.)`);
        break;
      }
      case 'ax2q': {
        ja.push(`一般に、二次関数 $y = ax^2 + q$ では、$(x=0)$ のときに頂点 $(0, q)$ をとります。`);
        en.push(`Generally, the vertex of $y = ax^2 + q$ is $(0, q)$.`);

        ja.push(`グラフを見ると頂点は $(0, ${q})$ なので、$q = ${q}$ です。`);
        en.push(`From the graph, the vertex is $(0, ${q})$, so $q = ${q}$.`);

        ja.push(`$y = ax^2 ${latexSigned(q)}$ に通る点 $(${pt.x}, ${pt.y})$ の座標を代入して $a$ を求めます：`);
        en.push(`Substitute the point $(${pt.x}, ${pt.y})$ into $y = ax^2 ${latexSigned(q)}$ to find $a$:`);

        const leftQ = pt.y - q;
        ja.push(`$${pt.y} = a \\times ${paren(pt.x)}^2 ${latexSigned(q)}$ 　より　 $${leftQ} = ${formatCoeff(pt.x * pt.x, 'a')}$ 　となるので　 $a = ${a}$`);
        en.push(`$${pt.y} = a \\times ${paren(pt.x)}^2 ${latexSigned(q)} \\implies ${leftQ} = ${formatCoeff(pt.x * pt.x, 'a')} \\implies a = ${a}$`);
        break;
      }
      case 'axp2': {
        ja.push(`一般に、二次関数 $y = a(x - p)^2$ では、頂点は $(p, 0)$ となります。`);
        en.push(`Generally, the vertex of $y = a(x - p)^2$ is $(p, 0)$.`);

        ja.push(`グラフを見ると頂点は $(${p}, 0)$ なので、$p = ${p}$ です。`);
        en.push(`From the graph, the vertex is $(${p}, 0)$, so $p = ${p}$.`);

        ja.push(`$y = a(x ${latexSigned(-p)})^2$ に通る点 $(${pt.x}, ${pt.y})$ を代入して $a$ を求めます：`);
        en.push(`Substitute the point $(${pt.x}, ${pt.y})$ into $y = a(x ${latexSigned(-p)})^2$ to find $a$:`);

        const insideP = pt.x - p;
        ja.push(`$${pt.y} = a \\times (${pt.x} ${latexSigned(-p)})^2$ 　より　 $${pt.y} = ${formatCoeff(insideP * insideP, 'a')}$ 　となるので　 $a = ${a}$`);
        en.push(`$${pt.y} = a \\times (${pt.x} ${latexSigned(-p)})^2 \\implies ${pt.y} = ${formatCoeff(insideP * insideP, 'a')} \\implies a = ${a}$`);
        break;
      }
      case 'axp2q': {
        ja.push(`一般に、二次関数 $y = a(x - p)^2 + q$ では、頂点は $(p, q)$ となります。`);
        en.push(`Generally, the vertex of $y = a(x - p)^2 + q$ is $(p, q)$.`);

        ja.push(`グラフを見ると頂点は $(${p}, ${q})$ なので、$p = ${p}$、$q = ${q}$ です。`);
        en.push(`From the graph, the vertex is $(${p}, ${q})$, so $p = ${p}, q = ${q}$.`);

        ja.push(`$y = a(x ${latexSigned(-p)})^2 ${latexSigned(q)}$ に通る点 $(${pt.x}, ${pt.y})$ を代入して $a$ を求めます：`);
        en.push(`Substitute the point $(${pt.x}, ${pt.y})$ into $y = a(x ${latexSigned(-p)})^2 ${latexSigned(q)}$ to find $a$:`);

        const insidePQ = pt.x - p;
        const leftPQ = pt.y - q;
        ja.push(`$${pt.y} = a \\times (${pt.x} ${latexSigned(-p)})^2 ${latexSigned(q)}$ 　より　 $${leftPQ} = ${formatCoeff(insidePQ * insidePQ, 'a')}$ 　となるので　 $a = ${a}$`);
        en.push(`$${pt.y} = a \\times (${pt.x} ${latexSigned(-p)})^2 ${latexSigned(q)} \\implies ${leftPQ} = ${formatCoeff(insidePQ * insidePQ, 'a')} \\implies a = ${a}$`);
        break;
      }
      case 'kx': {
        ja.push(`一般に、$x$軸と$y$軸を漸近線とする双曲線は $y = \\dfrac{k}{x}$ （$k \\neq 0$） と置けます。`);
        en.push(`Generally, a hyperbola with the axes as asymptotes can be written as $y = \\dfrac{k}{x}$ ($k \\neq 0$).`);

        ja.push(`ここで、$k$ が正だとグラフは第1象限と第3象限（右上と左下）に、$k$ が負だと第2象限と第4象限（左上と右下）に現れます。`);
        en.push(`If $k > 0$, the graph is in quadrants I and III (top-right, bottom-left). If $k < 0$, it is in II and IV (top-left, bottom-right).`);

        ja.push(`グラフを見ると、通る点として $(${pt.x}, ${pt.y})$ が読み取れます。`);
        en.push(`From the graph, we can read the passing point $(${pt.x}, ${pt.y})$.`);

        ja.push(`$x = ${pt.x}, y = ${pt.y}$ を代入して $k$ を求めます：<br> $${pt.y} = \\dfrac{k}{${pt.x}}$ 　より　 $k = ${pt.y} \\times ${paren(pt.x)} = ${k}$`);
        en.push(`Substitute $x = ${pt.x}$ and $y = ${pt.y}$ to find $k$:<br> $${pt.y} = \\dfrac{k}{${pt.x}} \\implies k = ${pt.y} \\times ${paren(pt.x)} = ${k}$`);
        break;
      }
      case 'kxp': {
        ja.push(`一般に、$y = \\dfrac{k}{x - p}$ は漸近線が $x = p$ と $y = 0$ の双曲線です。`);
        en.push(`Generally, $y = \\dfrac{k}{x - p}$ is a hyperbola with asymptotes $x = p$ and $y = 0$.`);

        ja.push(`グラフを見ると、垂直な漸近線が $x = ${p}$ なので、$p = ${p}$ です。`);
        en.push(`From the graph, the vertical asymptote is $x = ${p}$, so $p = ${p}$.`);

        ja.push(`ここで、$k$ が正だとグラフは漸近線を基準に右上と左下に、$k$ が負だと左上と右下に現れます。`);
        en.push(`If $k > 0$, it appears top-right and bottom-left relative to the asymptotes. If $k < 0$, top-left and bottom-right.`);

        ja.push(`$y = \\dfrac{k}{x ${latexSigned(-p)}}$ に通る点 $(${pt.x}, ${pt.y})$ を代入して $k$ を求めます：`);
        en.push(`Substitute the passing point $(${pt.x}, ${pt.y})$ into $y = \\dfrac{k}{x ${latexSigned(-p)}}$ to find $k$:`);

        const denom = pt.x - p;
        ja.push(`$${pt.y} = \\dfrac{k}{${pt.x} ${latexSigned(-p)}} = \\dfrac{k}{${denom}}$ 　より　 $k = ${pt.y} \\times ${paren(denom)} = ${k}$`);
        en.push(`$${pt.y} = \\dfrac{k}{${denom}} \\implies k = ${pt.y} \\times ${paren(denom)} = ${k}$`);
        break;
      }
      case 'kxpq': {
        ja.push(`一般に、$y = \\dfrac{k}{x - p} + q$ は漸近線が $x = p$ と $y = q$ の双曲線です。`);
        en.push(`Generally, $y = \\dfrac{k}{x - p} + q$ is a hyperbola with asymptotes $x = p$ and $y = q$.`);

        ja.push(`グラフを見ると、漸近線が $x = ${p}, y = ${q}$ なので、$p = ${p}, q = ${q}$ です。`);
        en.push(`From the graph, the asymptotes are $x = ${p}$ and $y = ${q}$, so $p = ${p}, q = ${q}$.`);

        ja.push(`ここで、$k$ が正だとグラフは漸近線を基準に右上と左下に、$k$ が負だと左上と右下に現れます。`);
        en.push(`If $k > 0$, it appears top-right and bottom-left relative to the asymptotes. If $k < 0$, top-left and bottom-right.`);

        ja.push(`$y = \\dfrac{k}{x ${latexSigned(-p)}} ${latexSigned(q)}$ に通る点 $(${pt.x}, ${pt.y})$ を代入して $k$ を求めます：`);
        en.push(`Substitute the passing point $(${pt.x}, ${pt.y})$ into $y = \\dfrac{k}{x ${latexSigned(-p)}} ${latexSigned(q)}$ to find $k$:`);

        const num = pt.y - q;
        const den = pt.x - p;
        ja.push(`$${pt.y} = \\dfrac{k}{${pt.x} ${latexSigned(-p)}} ${latexSigned(q)}$ 　より　 $${num} = \\dfrac{k}{${den}}$ 　となるので　 $k = ${num} \\times ${paren(den)} = ${k}$`);
        en.push(`$${pt.y} = \\dfrac{k}{${den}} ${latexSigned(q)} \\implies ${num} = \\dfrac{k}{${den}} \\implies k = ${k}$`);
        break;
      }
    }
  } else {
    // mode === 'f2g'
    const choiceChar = String.fromCharCode(65 + correctIndex);
    switch(form) {
      case 'ax':
        ja.push(`一般に、原点を通る直線は $y = ax$ と置けます。`);
        en.push(`Generally, a line passing through the origin can be written as $y = ax$.`);
        ja.push(`この式 $y = ${latexCoeff(a, 'x')}$ では、$a = ${a}$ です。`);
        en.push(`In this formula, $a = ${a}$.`);
        ja.push(`傾きが $a = ${a}$ であり${a > 0 ? '正なので右上がりの直線' : '負なので右下がりの直線'}になります。`);
        en.push(`The slope is $a = ${a}$, which is ${a > 0 ? 'positive (rising to the right)' : 'negative (falling to the right)'}.`);
        ja.push(`また、$x = 1$ のとき $y = ${a}$ なので、点 $(1, ${a})$ を通ります。`);
        en.push(`When $x = 1$, $y = ${a}$, so it passes through $(1, ${a})$.`);
        break;
      case 'axb':
        ja.push(`一般に、直線は $y = ax + b$ と置けます。`);
        en.push(`Generally, a line can be written as $y = ax + b$.`);
        ja.push(`この式では、$a = ${a}$、$b = ${b}$ です。`);
        en.push(`In this formula, $a = ${a}$ and $b = ${b}$.`);
        ja.push(`$y$切片が $b = ${b}$ なので、$y$軸上の点 $(0, ${b})$ を通ります。`);
        en.push(`The y-intercept is $b = ${b}$, so it passes through $(0, ${b})$ on the y-axis.`);
        ja.push(`傾きが $a = ${a}$ であり${a > 0 ? '正なので右上がり' : '負なので右下がり'}の直線になります。`);
        en.push(`The slope is $a = ${a}$, which is ${a > 0 ? 'positive (rising)' : 'negative (falling)'}.`);
        ja.push(`例えば、$x = 1$ のとき $y = ${a + b}$ なので、点 $(1, ${a + b})$ を通ります。`);
        en.push(`For example, when $x = 1$, $y = ${a + b}$, so it passes through $(1, ${a + b})$.`);
        break;
      case 'ax2':
        ja.push(`一般に、頂点が原点の二次関数は $y = ax^2$ と置けます。`);
        en.push(`Generally, a quadratic function with its vertex at the origin is $y = ax^2$.`);
        ja.push(`この式 $y = ${latexCoeff(a, 'x^2')}$ では、$a = ${a}$ です。`);
        en.push(`In this formula, $a = ${a}$.`);
        ja.push(`$a = ${a}$ が${a > 0 ? '正なので下に凸（上に開く）' : '負なので上に凸（下に開く）'}のグラフになります。`);
        en.push(`Since $a = ${a}$ is ${a > 0 ? 'positive, it opens upward' : 'negative, it opens downward'}.`);
        ja.push(`また、$x = 1$ のとき $y = ${a}$ なので、点 $(1, ${a})$ を通ります。`);
        en.push(`When $x = 1$, $y = ${a}$, so it passes through $(1, ${a})$.`);
        break;
      case 'ax2q':
        ja.push(`一般に、$y$軸上に頂点を持つ二次関数は $y = ax^2 + q$ と置けます。`);
        en.push(`Generally, a quadratic function with its vertex on the y-axis is $y = ax^2 + q$.`);
        ja.push(`この式では、$a = ${a}$、$q = ${q}$ です。`);
        en.push(`In this formula, $a = ${a}$ and $q = ${q}$.`);
        ja.push(`頂点は $(0, q)$ なので、$(0, ${q})$ となります。`);
        en.push(`The vertex is $(0, q)$, which is $(0, ${q})$.`);
        ja.push(`$a = ${a}$ が${a > 0 ? '正なので下に凸（上に開く）' : '負なので上に凸（下に開く）'}のグラフになります。`);
        en.push(`Since $a = ${a}$ is ${a > 0 ? 'positive, it opens upward' : 'negative, it opens downward'}.`);
        ja.push(`また、$x = 1$ のとき $y = ${a + q}$ なので、点 $(1, ${a + q})$ を通ります。`);
        en.push(`When $x = 1$, $y = ${a + q}$, so it passes through $(1, ${a + q})$.`);
        break;
      case 'axp2':
        ja.push(`一般に、$x$軸上に頂点を持つ二次関数は $y = a(x - p)^2$ と置けます。`);
        en.push(`Generally, a quadratic function with its vertex on the x-axis is $y = a(x - p)^2$.`);
        ja.push(`この式では、$a = ${a}$、$p = ${p}$ です。`);
        en.push(`In this formula, $a = ${a}$ and $p = ${p}$.`);
        ja.push(`頂点は $(p, 0)$ なので、$(${p}, 0)$ となります。`);
        en.push(`The vertex is $(p, 0)$, which is $(${p}, 0)$.`);
        ja.push(`$a = ${a}$ が${a > 0 ? '正なので下に凸（上に開く）' : '負なので上に凸（下に開く）'}のグラフになります。`);
        en.push(`Since $a = ${a}$ is ${a > 0 ? 'positive, it opens upward' : 'negative, it opens downward'}.`);
        ja.push(`また、頂点から$x$が1ずれた $x = ${p + 1}$ のとき $y = ${a}$ なので、点 $(${p + 1}, ${a})$ を通ります。`);
        en.push(`When $x = ${p + 1}$, $y = ${a}$, so it passes through $(${p + 1}, ${a})$.`);
        break;
      case 'axp2q':
        ja.push(`一般に、二次関数は $y = a(x - p)^2 + q$ と置けます。`);
        en.push(`Generally, a quadratic function can be written as $y = a(x - p)^2 + q$.`);
        ja.push(`この式では、$a = ${a}$、$p = ${p}$、$q = ${q}$ です。`);
        en.push(`In this formula, $a = ${a}$, $p = ${p}$, and $q = ${q}$.`);
        ja.push(`頂点は $(p, q)$ なので、$(${p}, ${q})$ となります。`);
        en.push(`The vertex is $(p, q)$, which is $(${p}, ${q})$.`);
        ja.push(`$a = ${a}$ が${a > 0 ? '正なので下に凸（上に開く）' : '負なので上に凸（下に開く）'}のグラフになります。`);
        en.push(`Since $a = ${a}$ is ${a > 0 ? 'positive, it opens upward' : 'negative, it opens downward'}.`);
        ja.push(`また、$x = ${p + 1}$ のとき $y = ${a + q}$ なので、点 $(${p + 1}, ${a + q})$ を通ります。`);
        en.push(`When $x = ${p + 1}$, $y = ${a + q}$, so it passes through $(${p + 1}, ${a + q})$.`);
        break;
      case 'kx':
        ja.push(`一般に、双曲線は $y = \\dfrac{k}{x}$ と置けます。`);
        en.push(`Generally, a hyperbola can be written as $y = \\dfrac{k}{x}$.`);
        ja.push(`この式では、$k = ${k}$ です。`);
        en.push(`In this formula, $k = ${k}$.`);
        ja.push(`漸近線は $x = 0$ と $y = 0$ です。`);
        en.push(`The asymptotes are $x = 0$ and $y = 0$.`);
        ja.push(`$k$ が ${k} で${k > 0 ? '正なので、グラフは第1象限と第3象限（右上と左下）に現れます。' : '負なので、グラフは第2象限と第4象限（左上と右下）に現れます。'}`);
        en.push(`Since $k = ${k}$ is ${k > 0 ? 'positive, it appears in quadrants I and III (top-right and bottom-left).' : 'negative, it appears in quadrants II and IV (top-left and bottom-right).'}`);
        ja.push(`また、$x = 1$ のとき $y = ${k}$ なので、点 $(1, ${k})$ を通ります。`);
        en.push(`When $x = 1$, $y = ${k}$, so it passes through $(1, ${k})$.`);
        break;
      case 'kxp':
        ja.push(`一般に、双曲線は $y = \\dfrac{k}{x - p}$ と置けます。`);
        en.push(`Generally, a hyperbola can be written as $y = \\dfrac{k}{x - p}$.`);
        ja.push(`この式では、$k = ${k}$、$p = ${p}$ です。`);
        en.push(`In this formula, $k = ${k}$ and $p = ${p}$.`);
        ja.push(`漸近線は $x = p$ と $y = 0$ なので、$x = ${p}$ と $y = 0$ になります。`);
        en.push(`The asymptotes are $x = p$ and $y = 0$, so $x = ${p}$ and $y = 0$.`);
        ja.push(`$k$ が ${k} で${k > 0 ? '正なので、漸近線を基準として右上と左下に現れます。' : '負なので、漸近線を基準として左上と右下に現れます。'}`);
        en.push(`Since $k = ${k}$ is ${k > 0 ? 'positive, it appears top-right and bottom-left relative to the asymptotes.' : 'negative, it appears top-left and bottom-right relative to the asymptotes.'}`);
        ja.push(`また、漸近線から$x$が1ずれた $x = ${p + 1}$ のとき $y = ${k}$ なので、点 $(${p + 1}, ${k})$ を通ります。`);
        en.push(`When $x = ${p + 1}$, $y = ${k}$, so it passes through $(${p + 1}, ${k})$.`);
        break;
      case 'kxpq':
        ja.push(`一般に、双曲線は $y = \\dfrac{k}{x - p} + q$ と置けます。`);
        en.push(`Generally, a hyperbola can be written as $y = \\dfrac{k}{x - p} + q$.`);
        ja.push(`この式では、$k = ${k}$、$p = ${p}$、$q = ${q}$ です。`);
        en.push(`In this formula, $k = ${k}, p = ${p}, q = ${q}$.`);
        ja.push(`漸近線は $x = p$ と $y = q$ なので、$x = ${p}$ と $y = ${q}$ になります。`);
        en.push(`The asymptotes are $x = p$ and $y = q$, so $x = ${p}$ and $y = ${q}$.`);
        ja.push(`$k$ が ${k} で${k > 0 ? '正なので、漸近線を基準として右上と左下に現れます。' : '負なので、漸近線を基準として左上と右下に現れます。'}`);
        en.push(`Since $k = ${k}$ is ${k > 0 ? 'positive, it appears top-right and bottom-left relative to the asymptotes.' : 'negative, it appears top-left and bottom-right relative to the asymptotes.'}`);
        ja.push(`また、$x = ${p + 1}$ のとき $y = ${k + q}$ なので、点 $(${p + 1}, ${k + q})$ を通ります。`);
        en.push(`When $x = ${p + 1}$, $y = ${k + q}$, so it passes through $(${p + 1}, ${k + q})$.`);
        break;
    }
    
    ja.push(`これらを満たすグラフは <strong>${TXT.choiceLabel} ${choiceChar}</strong> です。`);
    en.push(`The graph that satisfies these conditions is <strong>${TXT.choiceLabel} ${choiceChar}</strong>.`);
  }

  return isJa ? ja : en;
}

function explanationToHtml(exp, isCorrect, correctTex, domainObj, mode, correctIndex) {
  const resultClass = isCorrect ? 'correct' : 'wrong';
  const choiceChar = String.fromCharCode(65 + correctIndex);
  
  let resultTitle;
  let ansText;

  if (mode === 'f2g') {
    resultTitle = isCorrect 
      ? `${TXT.ansTitleCorrect} &nbsp;&rarr;&nbsp; <span class="math-ans">${TXT.choiceLabel} ${choiceChar}</span>`
      : `${TXT.ansTitleWrong} &nbsp; <span class="math-ans">${TXT.choiceLabel} ${choiceChar}</span>`;
    
    ansText = `${TXT.ansLabel} &nbsp; <span class="math-ans">${TXT.choiceLabel} ${choiceChar}</span>`;
    ansText += `<br><br><div style="font-weight:700; color:var(--muted); margin-bottom:4px;">${TXT.formulaLabel}</div><div class="math-ans">${renderKatex(correctTex)}</div>`;
  } else {
    resultTitle = isCorrect 
      ? `${TXT.ansTitleCorrect} &nbsp;&rarr;&nbsp; <span class="math-ans">${renderKatex(correctTex)}</span>`
      : `${TXT.ansTitleWrong} &nbsp; <span class="math-ans">${renderKatex(correctTex)}</span>`;
      
    ansText = `${TXT.ansLabel} &nbsp; <span class="math-ans">${renderKatex(correctTex)}</span>`;
  }

  if (domainObj && domainObj.exclude.length > 0) {
    ansText += ` &nbsp; <span style="font-size:0.85em; color:var(--muted); font-weight:normal;">(${TXT.domain}${renderKatex(domainObj.text)})</span>`;
  }

  let mainExpl = [];
  let altExpl = [];
  let isAltSection = false;

  exp.forEach((line) => {
    if (line.includes('（別解）') || line.includes('(Alternative)')) {
      isAltSection = true;
    }
    if (isAltSection) {
      altExpl.push(line);
    } else {
      mainExpl.push(line);
    }
  });

  const parse = (text) => text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => renderKatex(tex.trim(), true))
                              .replace(/\$([^$]+)\$/g, (_, tex) => renderKatex(tex.trim(), false));

  const mainLis = mainExpl.map(text => `
    <li>
      <div class="exp-li-ja">${parse(text)}</div>
    </li>
  `).join('');

  let altHtml = '';
  if (altExpl.length > 0) {
    const altContent = altExpl.map(text => `
      <div style="margin-bottom: 14px;">
        <div class="exp-li-ja">${parse(text)}</div>
      </div>
    `).join('');
    altHtml = `
      <div style="margin-top: 24px;">
        ${altContent}
      </div>
    `;
  }

  return `
    <div class="exp-box ${resultClass}">
      <div class="exp-header">
        <h3 class="exp-title">${resultTitle}</h3>
      </div>
      <div class="exp-body">
        <div class="exp-ans-line">${ansText}</div>
        <div class="exp-expl-label">${TXT.explLabel}</div>
        <ul class="exp-list">
          ${mainLis}
        </ul>
        ${altHtml}
        <div style="text-align: center; margin-top: 24px;">
          <button type="button" class="btn-next next-btn-exp">${TXT.nextBtn}</button>
        </div>
      </div>
    </div>
  `;
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
    const pts = samplePoints(currentForm, correctParams, 3);
    if ((currentForm === 'kx' || currentForm === 'kxp' || currentForm === 'kxpq') && pts.length < 2) continue;
    break;
  }

  const wrongTwo = shuffle(distractors).slice(0, 2);
  const optionsParams = shuffle([correctParams, ...wrongTwo]);
  const correctIndex = optionsParams.findIndex((p) => paramsKey(p) === paramsKey(correctParams));
  lastSignature = signature;
  
  const pt = pickPrimaryPoint(currentForm, correctParams);

  return {
    form: currentForm,
    type: currentType,
    mode: currentMode,
    correctParams,
    optionsParams,
    correctIndex,
    primaryPoint: pt,
    explanation: buildExplanation(currentForm, correctParams, currentMode, pt, correctIndex)
  };
}

/* ========== Render ========== */
function renderFormMenu() {
  const forms = FORM_OPTIONS[currentType];
  formMenu.innerHTML = forms
    .map((f) => {
      const active = f.id === currentForm;
      return `<button type="button" class="chip${active ? ' active' : ''}" data-form="${f.id}" role="tab" aria-selected="${active ? 'true' : 'false'}"><span class="tex" data-tex="${f.tex.replace(/"/g, '&quot;')}"></span></button>`;
    })
    .join('');
  renderKatexIn(formMenu);
}

function applyModeUI() {
  document.title = TXT.title;

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
  const { mode, form, correctParams, optionsParams, primaryPoint } = problem;
  questionArea.innerHTML = '';
  
  if (mode === 'g2f') {
    const layout = document.createElement('div');
    layout.innerHTML = `
      <p class="question-prompt">${TXT.g2fPrompt}</p>
      <div class="two-pane-layout">
        <div class="pane-left">
          <div class="graph-frame">
            ${buildGraphSvg(form, correctParams, { size: 360, primaryPoint, showAsymptotes: true, showLabels: true, compact: false })}
          </div>
          <div class="hint-box">
            <strong style="margin-bottom: 8px; font-size: 0.95rem; color: #1a2b25; display:block; text-align:center;">
              ${TXT.keyPoints}
            </strong>
            <div style="line-height:1.6; font-weight: 700;">
              ${featuresCaptionHtml(form, correctParams, primaryPoint)}
            </div>
          </div>
        </div>
        <div class="pane-right">
          <div class="choices" id="choicesGroup"></div>
          <div id="nextBtnContainer" style="display: none; margin-top: 16px; text-align: center;">
            <button type="button" class="btn-next next-btn-main">${TXT.nextBtn}</button>
            <p style="margin-top: 10px; font-size: 0.9rem; color: var(--muted); font-weight: 700;">${TXT.seeExpl}</p>
          </div>
        </div>
      </div>
    `;
    questionArea.appendChild(layout);

    const choicesGroup = document.getElementById('choicesGroup');
    optionsParams.forEach((params, i) => {
      const fmt = formulaHtml(form, params, true);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.dataset.index = String(i);
      btn.innerHTML = `
        <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
        <span class="choice-content">
          ${fmt.main}
          <span class="domain">${TXT.domain}${renderKatex(fmt.domain.text)}</span>
        </span>
        <span class="choice-badge"></span>
      `;
      choicesGroup.appendChild(btn);
    });

  } else {
    const layout = document.createElement('div');
    layout.className = 'one-pane-layout';
    
    const fmt = formulaHtml(form, correctParams, true);
    layout.innerHTML = `
      <div class="question-header-f2g" id="f2gHeaderArea">
        <p class="question-prompt">${TXT.f2gPrompt}</p>
        <div class="formula-display">
          ${fmt.main}<span class="domain">${TXT.domain}${renderKatex(fmt.domain.text)}</span>
        </div>
      </div>
      <div class="choices choices-graph" id="choicesGroup"></div>
      <div id="nextBtnContainer" style="display: none; margin-top: 16px; text-align: center;">
        <button type="button" class="btn-next next-btn-main">${TXT.nextBtn}</button>
        <p style="margin-top: 10px; font-size: 0.9rem; color: var(--muted); font-weight: 700;">${TXT.seeExpl}</p>
      </div>
    `;
    questionArea.appendChild(layout);

    const choicesGroup = document.getElementById('choicesGroup');
    optionsParams.forEach((params, i) => {
      const pt = pickPrimaryPoint(form, params);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn choice-graph';
      btn.dataset.index = String(i);
      btn.innerHTML = `
        <div class="choice-header">
          <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
          <span class="choice-badge"></span>
        </div>
        <div class="graph-choice-preview">
          ${buildGraphSvg(form, params, { size: 300, primaryPoint: pt, showAsymptotes: true, showLabels: true, compact: true })}
        </div>
        <div class="graph-features">${featuresCaptionHtml(form, params, pt)}</div>
      `;
      choicesGroup.appendChild(btn);
    });
  }
}

function clearFeedback() {
  explanationEl.hidden = true;
  explanationEl.innerHTML = '';
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

  const { mode, correctIndex, explanation, form, correctParams } = currentProblem;
  const buttons = questionArea.querySelectorAll('.choice-btn');
  const isCorrect = index === correctIndex;

  buttons.forEach((btn) => {
    btn.disabled = true;
    const iNum = Number(btn.dataset.index);
    const badge = btn.querySelector('.choice-badge');
    if (iNum === correctIndex) {
      btn.classList.add('is-correct');
      if (badge) badge.textContent = TXT.correct;
    } else if (iNum === index && !isCorrect) {
      btn.classList.add('is-wrong');
      if (badge) badge.textContent = TXT.incorrect;
    } else {
      btn.classList.add('is-dimmed');
    }
  });

  if (isCorrect) {
    correctCount += 1;
    streak += 1;
  } else {
    wrongCount += 1;
    streak = 0;
  }

  const fmt = formulaHtml(form, correctParams, true);
  explanationEl.innerHTML = explanationToHtml(
    explanation, 
    isCorrect, 
    fmt.tex, 
    fmt.domain,
    mode,
    correctIndex
  );
  explanationEl.hidden = false;
  
  updateScoreboard();

  setTimeout(() => {
    const container = document.getElementById('nextBtnContainer');
    if (container) {
      container.style.display = 'block';
      const nextBtn = container.querySelector('.next-btn-main');
      if (nextBtn) nextBtn.focus({ preventScroll: true });
    }
  }, 100);
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

questionArea.addEventListener('click', (e) => {
  if (e.target.closest('.btn-next')) {
    newProblem();
    return;
  }
  const btn = e.target.closest('.choice-btn');
  if (!btn || btn.disabled || locked) return;
  selectChoice(Number(btn.dataset.index));
});

explanationEl.addEventListener('click', (e) => {
  if (e.target.closest('.btn-next')) {
    newProblem();
  }
});

resetBtn.addEventListener('click', () => {
  correctCount = 0;
  wrongCount = 0;
  streak = 0;
  updateScoreboard();
  newProblem();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && locked) {
    const nextBtnMain = document.querySelector('#nextBtnContainer .next-btn-main');
    if (nextBtnMain) {
      e.preventDefault();
      nextBtnMain.click();
      return;
    }
    const nextBtnExp = explanationEl.querySelector('.next-btn-exp');
    if (nextBtnExp) {
      e.preventDefault();
      nextBtnExp.click();
      return;
    }
  }
  if (locked) return;
  const map = { '1': 0, '2': 1, '3': 2, a: 0, b: 1, c: 2, A: 0, B: 1, C: 2 };
  if (e.key in map) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    selectChoice(map[e.key]);
  }
});

/* ========== Mode setters ========== */
function setType(type) {
  if (!TYPE_META[type] || type === currentType) return;
  currentType = type;
  currentForm = FORM_OPTIONS[type][0].id;
  applyModeUI();
  newProblem();
}

function setForm(form) {
  if (!FORM_OPTIONS[currentType].some((f) => f.id === form) || form === currentForm) return;
  currentForm = form;
  applyModeUI();
  newProblem();
}

function setMode(mode) {
  if (!MODE_META[mode] || mode === currentMode) return;
  currentMode = mode;
  applyModeUI();
  newProblem();
}

/* ========== Init ========== */
function init() {
  applyModeUI();
  updateScoreboard();
  newProblem();
}

if (typeof katex !== 'undefined') {
  init();
} else {
  window.addEventListener('load', init);
  setTimeout(() => {
    if (!currentProblem) init();
  }, 300);
}