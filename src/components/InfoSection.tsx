import type { InfoItem, Level } from '../types';

interface Props {
  level: Level;
  appliesIf: InfoItem[];
  caseStudy: string;
  damage: InfoItem[];
  defense: InfoItem[];
  devNote: InfoItem[];
}

export function InfoSection({ level, appliesIf, caseStudy, damage, defense, devNote }: Props) {
  const appliesTitle = level === 'beginner'
    ? '自分のアプリにこんな機能があれば要注意'
    : '該当する機能・実装パターン';
  return (
    <>
      <div className="applies-if">
        <h3 className="applies-if-title">{appliesTitle}</h3>
        <ul>
          {appliesIf.map((item, i) => (
            <li key={i}>
              <strong>{item.head}</strong> {item.body}
            </li>
          ))}
        </ul>
      </div>
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
