import { useLevel } from '../lib/level';

export function LevelToggle() {
  const { level, setLevel } = useLevel();
  return (
    <div className="level-toggle" role="radiogroup" aria-label="解説レベル">
      <button
        type="button"
        role="radio"
        aria-checked={level === 'pro'}
        className={level === 'pro' ? 'active' : ''}
        onClick={() => setLevel('pro')}
      >
        専門家向け
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={level === 'beginner'}
        className={level === 'beginner' ? 'active' : ''}
        onClick={() => setLevel('beginner')}
      >
        やさしい解説
      </button>
    </div>
  );
}
