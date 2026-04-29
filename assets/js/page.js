// 個別攻撃ページの共通レイアウトレンダリング
// 攻撃ごとの animation.js から呼び出して、被害事例・対策・開発注意の3カードを描画する。

export function renderAttackPage({ title, titleEn, caseStudy, damage, defense, devNote }) {
  document.title = `${title} - Cyber Attack Visualization`;
  const root = document.getElementById('attack-info');
  if (!root) return;

  const list = (arr) => arr.map(item => {
    if (typeof item === 'string') return `<li>${item}</li>`;
    return `<li><strong>${item.head}</strong> ${item.body}</li>`;
  }).join('');

  root.innerHTML = `
    ${caseStudy ? `
      <div class="case-study">
        <span class="label">代表的な被害事例</span>
        ${caseStudy}
      </div>` : ''}
    <div class="info-grid">
      <div class="info-block damage">
        <h3>被害の例</h3>
        <ul>${list(damage)}</ul>
      </div>
      <div class="info-block defense">
        <h3>対策方法</h3>
        <ul>${list(defense)}</ul>
      </div>
      <div class="info-block dev-note">
        <h3>アプリ開発上の注意ポイント</h3>
        <ul>${list(devNote)}</ul>
      </div>
    </div>
  `;

  const h = document.querySelector('.attack-title');
  const e = document.querySelector('.attack-en');
  if (h) h.textContent = title;
  if (e) e.textContent = titleEn;
}
