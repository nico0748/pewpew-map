import { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { StageView } from './StageView';
import { InfoSection } from './InfoSection';
import { attackRegistry } from '../attacks';
import { useLevel } from '../lib/level';

export function AttackPage() {
  const { slug } = useParams<{ slug: string }>();
  const { level } = useLevel();
  const attack = slug ? attackRegistry[slug] : undefined;

  useEffect(() => {
    if (attack) document.title = `${attack.meta.name} — PEWPEW`;
    return () => { document.title = 'PEWPEW — Threat Pattern Library'; };
  }, [attack]);

  if (!attack) return <Navigate to="/" replace />;

  const useBeginner = level === 'beginner' && !!attack.beginner;
  const content = useBeginner
    ? {
        appliesIf: attack.beginner!.appliesIf ?? attack.appliesIf,
        caseStudy: attack.beginner!.caseStudy,
        damage: attack.beginner!.damage,
        defense: attack.beginner!.defense,
        devNote: attack.beginner!.devNote
      }
    : {
        appliesIf: attack.appliesIf,
        caseStudy: attack.caseStudy,
        damage: attack.damage,
        defense: attack.defense,
        devNote: attack.devNote
      };

  return (
    <div className="attack-page" style={{ ['--cat-color' as never]: attack.meta.category.color }}>
      <main>
        <nav className="crumbs" aria-label="パンくずリスト">
          <Link to="/">カタログ</Link><span>/</span><span>{attack.meta.category.label}</span>
        </nav>
        <section className="attack-hero">
          <div>
            <span className="attack-status"><i></i> INTERACTIVE EXPLAINER</span>
            <h1 className="attack-title">{attack.meta.name}</h1>
            <p className="attack-en">{attack.meta.nameEn}</p>
          </div>
          <dl className="attack-meta">
            <div><dt>Category</dt><dd>{attack.meta.category.label}</dd></div>
            <div><dt>Phases</dt><dd>{attack.steps.length} steps</dd></div>
            <div><dt>Mode</dt><dd>{level === 'beginner' ? 'Beginner' : 'Professional'}</dd></div>
          </dl>
        </section>
        {level === 'beginner' && !attack.beginner && (
          <div className="beginner-fallback-notice">
            この攻撃の「やさしい解説」は準備中です。専門家向けの説明を表示しています。
          </div>
        )}
        <section className="simulation-panel" aria-labelledby="simulation-title">
          <header className="simulation-header">
            <div>
              <span className="section-kicker">ATTACK FLOW</span>
              <h2 id="simulation-title">攻撃シミュレーション</h2>
            </div>
            <span className="simulation-mode"><i></i> STEP PLAYBACK</span>
          </header>
          <StageView attack={attack} level={level} />
        </section>
        <InfoSection
          level={level}
          appliesIf={content.appliesIf}
          caseStudy={content.caseStudy}
          damage={content.damage}
          defense={content.defense}
          devNote={content.devNote}
        />
      </main>
    </div>
  );
}
