import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'profile/cards');
const cache = path.join(output, 'badges.json');
const badgeSpecs = {
  cs: ['C%23-512BD4', ''],
  cpp: ['C%2B%2B-00599C', 'cplusplus'],
  unity: ['Unity-222222', 'unity'],
  unreal: ['Unreal_Engine-313131', 'unrealengine'],
  opengl: ['OpenGL-5586A4', 'opengl'],
  dx: ['DirectX_12-107C10', ''],
  git: ['Git-F05032', 'git'],
};
await mkdir(output, { recursive: true });
if (process.argv.includes('--refresh-badges')) {
  const entries = await Promise.all(Object.entries(badgeSpecs).map(async ([key, [label, logo]]) => {
    const url = `https://img.shields.io/badge/${label}?style=flat-square${logo ? `&logo=${logo}&logoColor=white` : ''}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Badge ${key}: HTTP ${response.status}`);
    const svg = await response.text();
    const width = Number(svg.match(/<svg\b[^>]*\bwidth="([\d.]+)"/)?.[1]);
    if (!width || !svg.includes('</svg>')) throw new Error(`Invalid badge: ${key}`);
    return [key, { width, source: url, svg }];
  }));
  await writeFile(cache, JSON.stringify(Object.fromEntries(entries), null, 2) + '\n');
}
const badges = JSON.parse(await readFile(cache, 'utf8'));
const source = await readFile(path.join(root, 'profile/stats/stats.svg'), 'utf8');
if (/Something went wrong|Resource not accessible/.test(source)) throw new Error('Refusing to render an error stats card');
const escape = (text) => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const value = (id) => {
  const match = source.match(new RegExp(`data-testid="${id}"[^>]*>\\s*([^<]+)<`));
  if (!match) throw new Error(`Missing stat: ${id}`);
  return escape(match[1].trim());
};
const stats = [
  ['Stars earned', value('stars')],
  ['Commits · past year', value('commits')],
  ['Pull requests', value('prs')],
  ['Issues', value('issues')],
  ['Repos contributed · past year', value('contribs')],
];
const rank = value('level-rank-icon');
const sourceCircumference = 2 * Math.PI * 40;
const sourceRankOffset = Number(source.match(/@keyframes rankAnimation[\s\S]*?to\s*\{\s*stroke-dashoffset:\s*([\d.]+)/)?.[1]);
if (!Number.isFinite(sourceRankOffset)) throw new Error('Missing rank progress');
const rankProgress = Math.max(0, Math.min(1, 1 - sourceRankOffset / sourceCircumference));
const themes = {
  light: { bg: '#f6f8fa', fg: '#1f2328', muted: '#59636e', accent: '#0969da', border: '#d0d7de', ring: '#d8dee4', star: '#9a6700', starBg: '#fff8c5' },
  dark: { bg: '#161b22', fg: '#e6edf3', muted: '#9da7b3', accent: '#58a6ff', border: '#30363d', ring: '#30363d', star: '#e3b341', starBg: '#2d2414' },
};
const frame = (title, desc, theme, body, styles = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="248" viewBox="0 0 460 248" role="img" aria-labelledby="title desc">
  <title id="title">${escape(title)}</title>
  <desc id="desc">${escape(desc)}</desc>
  ${styles}
  <rect x="0.5" y="0.5" width="459" height="247" rx="13.5" fill="${theme.bg}" stroke="${theme.border}"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="26" y="37" font-size="19" font-weight="600" fill="${theme.fg}">${escape(title)}</text>
    ${body}
  </g>
</svg>\n`;

for (const [name, theme] of Object.entries(themes)) {
  const fadeStyles = `<style>
    @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
    .fade { animation: fadeIn .35s ease-out both; }
    @media (prefers-reduced-motion: reduce) { .fade { animation: none; } }
  </style>`;
  let stack = '';
  const rows = [['Languages', ['cs', 'cpp']], ['Game engines', ['unity', 'unreal']], ['Graphics APIs', ['opengl', 'dx']], ['Version control', ['git']]];
  rows.forEach(([label, keys], index) => {
    const y = 69 + index * 42;
    let row = `<text x="26" y="${y + 14}" font-size="13.5" fill="${theme.muted}">${label}</text>`;
    let x = 158;
    for (const key of keys) {
      const badge = badges[key];
      const width = badge.width * 1.2;
      row += `<image x="${x}" y="${y - 4}" width="${width}" height="24" href="data:image/svg+xml;base64,${Buffer.from(badge.svg).toString('base64')}"/>`;
      x += width + 8;
    }
    const delay = (0.12 + index * 0.08).toFixed(2);
    stack += `<g class="fade" style="animation-delay:${delay}s">${row}</g>`;
  });
  const radius = 42;
  const circumference = (2 * Math.PI * radius).toFixed(3);
  const rankOffset = (Number(circumference) * (1 - rankProgress)).toFixed(3);
  const activityStyles = `<style>
    @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes drawRank { from { stroke-dashoffset: ${circumference}; } to { stroke-dashoffset: ${rankOffset}; } }
    .fade { animation: fadeIn .35s ease-out both; }
    .rank-progress { animation: drawRank 1s cubic-bezier(.2,.8,.2,1) .15s both; }
    @media (prefers-reduced-motion: reduce) { .fade, .rank-progress { animation: none; } }
  </style>`;
  let activity = `<g class="fade" style="animation-delay:.12s">
    <rect x="18" y="58" width="270" height="38" rx="8" fill="${theme.starBg}"/>
    <text x="30" y="83" font-size="14" font-weight="600" fill="${theme.star}">Stars earned</text>
    <text x="273" y="83" text-anchor="end" font-size="18" font-weight="700" fill="${theme.star}">${stats[0][1]}</text>
  </g>`;
  stats.slice(1).forEach(([label, count], index) => {
    const y = 122 + index * 31;
    const delay = (0.28 + index * 0.08).toFixed(2);
    activity += `<g class="fade" style="animation-delay:${delay}s"><text x="26" y="${y}" font-size="14" fill="${theme.muted}">${label}</text><text x="273" y="${y}" text-anchor="end" font-size="16" font-weight="600" fill="${theme.fg}">${count}</text></g>`;
  });
  activity += `<g>
    <circle cx="371" cy="139" r="${radius}" fill="none" stroke="${theme.ring}" stroke-width="7"/>
    <circle class="rank-progress" cx="371" cy="139" r="${radius}" fill="none" stroke="${theme.accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${rankOffset}" transform="rotate(-90 371 139)"/>
    <g class="fade" style="animation-delay:.75s">
      <text x="371" y="143" text-anchor="middle" font-size="22" font-weight="700" fill="${theme.fg}">${rank}</text>
      <text x="371" y="165" text-anchor="middle" font-size="10" font-weight="600" letter-spacing="1.4" fill="${theme.muted}">RANK</text>
    </g>
  </g>`;
  await writeFile(path.join(output, `tools-${name}.svg`), frame('Languages & Tools', 'C#, C++; Unity, Unreal Engine; OpenGL, DirectX 12; Git.', theme, stack, fadeStyles));
  await writeFile(path.join(output, `stats-${name}.svg`), frame('GitHub Activity', stats.map(([label, count]) => `${label}: ${count}`).join('; ') + `; Rank: ${rank}`, theme, activity, activityStyles));
}
console.log('Rendered light and dark profile cards from the existing GitHub stats.');
