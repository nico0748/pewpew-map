// トップページのカタログ描画
import { Attacks, Categories } from '../../data/attacks.js';

const root = document.getElementById('catalog');

const groups = new Map();
Object.values(Categories).forEach(c => groups.set(c.id, { cat: c, items: [] }));
Attacks.forEach(a => groups.get(a.category.id).items.push(a));

const html = [...groups.values()].map(({ cat, items }) => `
  <section class="category-block" style="--cat-color:${cat.color}">
    <h2>${cat.label}</h2>
    <div class="attack-grid">
      ${items.map(a => renderCard(a)).join('')}
    </div>
  </section>
`).join('');

root.innerHTML = html;

function renderCard(a) {
  const cls = a.implemented ? 'attack-card' : 'attack-card unimpl';
  const href = a.implemented ? `attacks/${a.slug}/index.html` : '#';
  const badge = a.implemented ? '実装済' : '準備中';
  return `
    <a class="${cls}" href="${href}">
      <span class="badge">${badge}</span>
      <div class="name">${a.name}</div>
      <div class="name-en">${a.nameEn}</div>
      <div class="summary">${a.summary}</div>
    </a>`;
}
