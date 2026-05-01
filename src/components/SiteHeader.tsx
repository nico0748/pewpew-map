import { Link, useLocation } from 'react-router-dom';
import { LevelToggle } from './LevelToggle';
import { useLevel } from '../lib/level';

export function SiteHeader() {
  const { pathname } = useLocation();
  const { level } = useLevel();
  const onTop = pathname === '/';
  return (
    <header className="site-header">
      <div className="site-header-row">
        <h1>Cyber Attack Visualization</h1>
        <LevelToggle />
      </div>
      <p className="lead">
        {onTop ? (
          level === 'beginner'
            ? 'サイバー攻撃の代表的な手口を、図とアニメーションでやさしく解説。バイブコーディングでアプリを作る人向けに、専門用語をできるだけ噛み砕いています。'
            : 'サイバー攻撃の代表的な手口をピクトグラム × アニメーションで可視化。被害事例・対策・開発上の注意点もあわせて学習できます。'
        ) : (
          <Link to="/">← カタログへ戻る</Link>
        )}
      </p>
    </header>
  );
}
