import { useEffect, useRef, useState } from 'react';
import { Stage } from '../lib/Stage';
import type { AttackDefinition } from '../types';

interface Props {
  attack: AttackDefinition;
}

/**
 * ステップ実行型のステージビュー。
 * - マウント時に attack.setup() を実行してアクターを配置
 * - 「次へ」ボタンを押すと steps[stepIdx] のアニメーションが流れ、stepIdx が進む
 * - 「リセット」ですべてを clearAll してから setup を再実行し、stepIdx を0に戻す
 */
export function StageView({ attack }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageInstance = useRef<Stage | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  // この再構築カウンタで Stage を作り直す
  const [rebuildKey, setRebuildKey] = useState(0);

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = new Stage(stageRef.current);
    attack.setup(stage);
    stageInstance.current = stage;
    return () => {
      stage.dispose();
      stageInstance.current = null;
    };
  }, [attack, rebuildKey]);

  const total = attack.steps.length;
  const currentStep = stepIdx > 0 ? attack.steps[stepIdx - 1] : null;
  const nextStep = stepIdx < total ? attack.steps[stepIdx] : null;
  const finished = stepIdx >= total;

  const onNext = () => {
    const stage = stageInstance.current;
    if (!stage || !nextStep) return;
    stage.clearTimers();
    stage.clearPackets();
    nextStep.run(stage);
    setStepIdx(stepIdx + 1);
  };

  const onReset = () => {
    setStepIdx(0);
    setRebuildKey((k) => k + 1); // useEffect で setup 再実行
  };

  return (
    <>
      <div className="stage" ref={stageRef} />
      <div className="step-info">
        <div className="step-progress">
          ステップ {stepIdx} / {total}
          {finished && <span className="finished-tag">完了</span>}
        </div>
        <div className="step-title">
          {finished
            ? '攻撃シナリオの再生が完了しました'
            : currentStep
              ? `現在のフェーズ: ${currentStep.title}`
              : `次のフェーズ: ${nextStep?.title ?? ''}`}
        </div>
        <div className="step-desc">
          {finished
            ? '「リセット」で最初から再生できます'
            : currentStep
              ? currentStep.description
              : nextStep?.description}
        </div>
      </div>
      <div className="controls">
        <button type="button" onClick={onNext} disabled={finished}>
          {stepIdx === 0 ? '▶ 開始' : finished ? '完了' : '次へ ▶'}
        </button>
        <button type="button" className="secondary" onClick={onReset}>
          リセット
        </button>
      </div>
    </>
  );
}
