import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { StageView } from './StageView';
import { InfoSection } from './InfoSection';
import { attackRegistry } from '../attacks';
import { useLevel } from '../lib/level';

export function AttackPage() {
  const { slug } = useParams<{ slug: string }>();
  const { level } = useLevel();
  const attack = slug ? attackRegistry[slug] : undefined;

  useEffect(() => {
    if (attack) document.title = `${attack.meta.name} - Cyber Attack Visualization`;
    return () => { document.title = 'Cyber Attack Visualization'; };
  }, [attack]);

  if (!attack) return <Navigate to="/" replace />;

  const useBeginner = level === 'beginner' && !!attack.beginner;
  const content = useBeginner
    ? {
        caseStudy: attack.beginner!.caseStudy,
        damage: attack.beginner!.damage,
        defense: attack.beginner!.defense,
        devNote: attack.beginner!.devNote
      }
    : {
        caseStudy: attack.caseStudy,
        damage: attack.damage,
        defense: attack.defense,
        devNote: attack.devNote
      };

  return (
    <div className="attack-page">
      <main>
        <div className="crumbs">カタログ / {attack.meta.category.label}</div>
        <h2 className="attack-title">{attack.meta.name}</h2>
        <p className="attack-en">{attack.meta.nameEn}</p>
        {level === 'beginner' && !attack.beginner && (
          <div className="beginner-fallback-notice">
            この攻撃の「やさしい解説」は準備中です。専門家向けの説明を表示しています。
          </div>
        )}
        <StageView attack={attack} level={level} />
        <InfoSection
          caseStudy={content.caseStudy}
          damage={content.damage}
          defense={content.defense}
          devNote={content.devNote}
        />
      </main>
    </div>
  );
}
