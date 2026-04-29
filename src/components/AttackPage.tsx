import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { StageView } from './StageView';
import { InfoSection } from './InfoSection';
import { attackRegistry } from '../attacks';

export function AttackPage() {
  const { slug } = useParams<{ slug: string }>();
  const attack = slug ? attackRegistry[slug] : undefined;

  useEffect(() => {
    if (attack) document.title = `${attack.meta.name} - Cyber Attack Visualization`;
    return () => { document.title = 'Cyber Attack Visualization'; };
  }, [attack]);

  if (!attack) return <Navigate to="/" replace />;

  return (
    <div className="attack-page">
      <main>
        <div className="crumbs">カタログ / {attack.meta.category.label}</div>
        <h2 className="attack-title">{attack.meta.name}</h2>
        <p className="attack-en">{attack.meta.nameEn}</p>
        <StageView attack={attack} />
        <InfoSection
          caseStudy={attack.caseStudy}
          damage={attack.damage}
          defense={attack.defense}
          devNote={attack.devNote}
        />
      </main>
    </div>
  );
}
