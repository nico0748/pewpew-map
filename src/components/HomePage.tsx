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
    <main className="container">
      {groups.map(({ category, items }) => (
        <section
          key={category.id}
          className="category-block"
          style={{ ['--cat-color' as never]: category.color }}
        >
          <h2>{level === 'beginner' ? BEGINNER_CATEGORY_LABELS[category.id] ?? category.label : category.label}</h2>
          <div className="attack-grid">
            {items.map((a) => (
              <AttackCard key={a.slug} attack={a} level={level} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function AttackCard({ attack, level }: { attack: AttackMeta; level: Level }) {
  const className = attack.implemented ? 'attack-card' : 'attack-card unimpl';
  const def = attackRegistry[attack.slug];
  const summary = level === 'beginner' && def?.beginner ? def.beginner.summary : attack.summary;
  const inner = (
    <>
      <span className="badge">{attack.implemented ? '実装済' : '準備中'}</span>
      <div className="name">{attack.name}</div>
      <div className="name-en">{attack.nameEn}</div>
      <div className="summary">{summary}</div>
    </>
  );
  if (!attack.implemented) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <Link to={`/attacks/${attack.slug}`} className={className}>
      {inner}
    </Link>
  );
}
