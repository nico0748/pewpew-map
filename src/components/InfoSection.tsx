import type { InfoItem } from '../types';

interface Props {
  caseStudy: string;
  damage: InfoItem[];
  defense: InfoItem[];
  devNote: InfoItem[];
}

export function InfoSection({ caseStudy, damage, defense, devNote }: Props) {
  return (
    <>
      <div className="case-study">
        <span className="label">代表的な被害事例</span>
        {caseStudy}
      </div>
      <div className="info-grid">
        <Block kind="damage" title="被害の例" items={damage} />
        <Block kind="defense" title="対策方法" items={defense} />
        <Block kind="dev-note" title="アプリ開発上の注意ポイント" items={devNote} />
      </div>
    </>
  );
}

function Block({
  kind,
  title,
  items
}: {
  kind: 'damage' | 'defense' | 'dev-note';
  title: string;
  items: InfoItem[];
}) {
  return (
    <div className={`info-block ${kind}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <strong>{item.head}</strong> {item.body}
          </li>
        ))}
      </ul>
    </div>
  );
}
