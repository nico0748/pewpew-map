import { Link, useLocation } from 'react-router-dom';
import { LevelToggle } from './LevelToggle';
import { useLevel } from '../lib/level';
import { AttacksMeta } from '../data/attacks';

const implementedCount = AttacksMeta.filter((attack) => attack.implemented).length;
const categoryCount = new Set(AttacksMeta.map((attack) => attack.category.id)).size;

function RadarMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5V1.8M20.5 12h1.7M12 20.5v1.7M3.5 12H1.8M12 12l5.7-5.7" />
    </svg>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const { level } = useLevel();
  const onTop = pathname === '/';
  return (
    <header className={`site-header${onTop ? ' site-header-home' : ''}`}>
      <div className="site-header-row site-width">
        <Link to="/" className="site-brand" aria-label="PEWPEW ホーム">
          <span className="brand-mark"><RadarMark /></span>
          <span className="brand-copy">
            <strong>PEWPEW</strong>
            <small>Threat Pattern Library</small>
          </span>
        </Link>
        <div className="site-header-actions">
          <Link to="/about" className={`site-nav-link${pathname === '/about' ? ' active' : ''}`}>
            About
          </Link>
          <LevelToggle />
        </div>
      </div>
      {onTop ? (
        <section className="site-hero site-width" aria-labelledby="site-hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><RadarMark /> INTERACTIVE SECURITY EDUCATION</div>
            <h1 id="site-hero-title">
              攻撃の構造を、<br />
              <span>動きで理解する。</span>
            </h1>
            <p>
              {level === 'beginner'
                ? 'サイバー攻撃の代表的な手口を、図とアニメーションでやさしく解説。専門用語を噛み砕き、自分のアプリに潜むリスクを見つけられます。'
                : '代表的な攻撃パターンをピクトグラムとステップアニメーションで可視化。攻撃経路から被害、対策、実装上の注意までを一つの体験に統合しました。'}
            </p>
          </div>
          <dl className="hero-metrics" aria-label="ライブラリ概要">
            <div>
              <dt>Threat patterns</dt>
              <dd>{implementedCount}</dd>
              <span>Interactive scenarios</span>
            </div>
            <div>
              <dt>Collections</dt>
              <dd>{categoryCount}</dd>
              <span>Security domains</span>
            </div>
            <div>
              <dt>Learning flow</dt>
              <dd className="metric-word">STEP</dd>
              <span>Self-paced playback</span>
            </div>
          </dl>
        </section>
      ) : (
        <div className="route-bar site-width">
          <Link to="/" className="back-link">
            <span aria-hidden="true">←</span> カタログへ戻る
          </Link>
          <span>INTERACTIVE THREAT PATTERN</span>
        </div>
      )}
    </header>
  );
}
