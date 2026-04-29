import { Link, useLocation } from 'react-router-dom';

export function SiteHeader() {
  const { pathname } = useLocation();
  const onTop = pathname === '/';
  return (
    <header className="site-header">
      <h1>Cyber Attack Visualization</h1>
      <p className="lead">
        {onTop ? (
          'サイバー攻撃の代表的な手口をピクトグラム × アニメーションで可視化。被害事例・対策・開発上の注意点もあわせて学習できます。'
        ) : (
          <Link to="/">← カタログへ戻る</Link>
        )}
      </p>
    </header>
  );
}
