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
    <section className="intelligence-section" aria-labelledby="intelligence-title">
      <header className="intelligence-header">
        <div>
          <span className="section-kicker">SECURITY INTELLIGENCE</span>
          <h2 id="intelligence-title">理解から、対策へ。</h2>
        </div>
        <p>攻撃が自分の実装に該当するかを確認し、実際の被害と防御策まで整理します。</p>
      </header>
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
    </section>
  );
}

function InsightIcon({ kind }: { kind: 'damage' | 'defense' | 'dev-note' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'damage') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.5v.1" /></svg>;
  if (kind === 'defense') return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M12 2.7 20 6v5.4c0 5.1-3.3 8.4-8 10-4.7-1.6-8-4.9-8-10V6l8-3.3Z" /><path d="m9.2 12 1.8 1.8 3.9-4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="M8 3h8M9 3v4l-4.5 8.5A3.5 3.5 0 0 0 7.6 21h8.8a3.5 3.5 0 0 0 3.1-5.5L15 7V3" /><path d="M7 14h10" /></svg>;
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
    <article className={`info-block ${kind}`}>
      <h3><span className="info-icon"><InsightIcon kind={kind} /></span>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <strong>{item.head}</strong> {item.body}
          </li>
        ))}
      </ul>
    </article>
  );
}
