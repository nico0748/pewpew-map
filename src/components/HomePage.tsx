import { Link } from 'react-router-dom';
import { AttacksMeta, Categories } from '../data/attacks';
import type { AttackCategory, AttackMeta } from '../types';

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

export function HomePage() {
  const groups = groupByCategory();
  return (
    <main className="container">
      {groups.map(({ category, items }) => (
        <section
          key={category.id}
          className="category-block"
          style={{ ['--cat-color' as never]: category.color }}
        >
          <h2>{category.label}</h2>
          <div className="attack-grid">
            {items.map((a) => (
              <AttackCard key={a.slug} attack={a} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function AttackCard({ attack }: { attack: AttackMeta }) {
  const className = attack.implemented ? 'attack-card' : 'attack-card unimpl';
  const inner = (
    <>
      <span className="badge">{attack.implemented ? '実装済' : '準備中'}</span>
      <div className="name">{attack.name}</div>
      <div className="name-en">{attack.nameEn}</div>
      <div className="summary">{attack.summary}</div>
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
