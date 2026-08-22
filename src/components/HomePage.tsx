import { Link } from 'react-router-dom';
import { AttacksMeta, Categories } from '../data/attacks';
import { attackRegistry } from '../attacks';
import { useLevel } from '../lib/level';
import type { AttackCategory, AttackMeta, Level } from '../types';

interface CategoryGroup {
  category: AttackCategory;
  items: AttackMeta[];
}

function groupByCategory(): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  Object.values(Categories).forEach((c) => map.set(c.id, { category: c, items: [] }));
  AttacksMeta.forEach((a) => map.get(a.category.id)!.items.push(a));
  return [...map.values()];
}

/** beginner モードのカテゴリ表示名(専門用語を噛み砕いた版)。 */
const BEGINNER_CATEGORY_LABELS: Record<string, string> = {
  web: 'Webサイト・Webアプリへの攻撃',
  mass: '不特定の人を狙う攻撃',
  target: '特定の会社・組織を狙う攻撃',
  auth: 'パスワードやログイン情報を盗む攻撃',
  ai: 'AIや機械学習(賢く判断するプログラム)への攻撃'
};

export function HomePage() {
  const { level } = useLevel();
  const groups = groupByCategory();
  return (
    <main className="container catalog-shell">
      <div className="catalog-intro">
        <div>
          <span className="section-kicker">THREAT CATALOG</span>
          <h2>脅威パターンを探索する</h2>
        </div>
        <p>カテゴリから攻撃を選択し、成立するまでの流れをステップごとに確認できます。</p>
      </div>
      {groups.map(({ category, items }, groupIndex) => (
        <section
          key={category.id}
          className="category-block"
          style={{ ['--cat-color' as never]: category.color }}
          aria-labelledby={`category-${category.id}`}
        >
          <header className="category-header">
            <span className="category-index">{String(groupIndex + 1).padStart(2, '0')}</span>
            <span className="category-icon"><CategoryIcon category={category.id} /></span>
            <div>
              <span className="category-kicker">COLLECTION / {category.id.toUpperCase()}</span>
              <h2 id={`category-${category.id}`}>
                {level === 'beginner' ? BEGINNER_CATEGORY_LABELS[category.id] ?? category.label : category.label}
              </h2>
            </div>
            <span className="category-count">{items.length} PATTERNS</span>
          </header>
          <div className="attack-grid">
            {items.map((a, index) => (
              <AttackCard key={a.slug} attack={a} level={level} index={index + 1} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (category === 'web') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01" /></svg>;
  if (category === 'mass') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M5 17a10 10 0 0 1 0-10M9 14a5.5 5.5 0 0 1 0-4M19 7a10 10 0 0 1 0 10M15 10a5.5 5.5 0 0 1 0 4" /><circle cx="12" cy="12" r="2" /></svg>;
  if (category === 'target') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>;
  if (category === 'auth') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="8" cy="12" r="4" /><path d="M12 12h9M17 12v3M20 12v2" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="17" r="2.5" /><path d="m8 8.5 2.5 6M16 8.5l-2.5 6M8.5 7h7" /></svg>;
}

function AttackCard({ attack, level, index }: { attack: AttackMeta; level: Level; index: number }) {
  const className = attack.implemented ? 'attack-card' : 'attack-card unimpl';
  const def = attackRegistry[attack.slug];
  const summary = level === 'beginner' && def?.beginner ? def.beginner.summary : attack.summary;
  const inner = (
    <>
      <div className="card-topline">
        <span className="attack-card-icon"><CategoryIcon category={attack.category.id} /></span>
        <span className="card-number">{String(index).padStart(2, '0')}</span>
        <span className="badge">{attack.implemented ? 'INTERACTIVE' : 'SOON'}</span>
      </div>
      <div className="name-en">{attack.nameEn}</div>
      <div className="name">{attack.name}</div>
      <div className="summary">{summary}</div>
      <span className="card-action">
        シミュレーションを見る
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </span>
    </>
  );
  if (!attack.implemented) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <Link to={`/attacks/${attack.slug}`} className={className} aria-label={`${attack.name}のシミュレーションを見る`}>
      {inner}
    </Link>
  );
}
