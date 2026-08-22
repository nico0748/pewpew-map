import { useEffect, useRef, useState } from 'react';
import { Stage } from '../lib/Stage';
import type { AttackDefinition, Level } from '../types';

interface Props {
  attack: AttackDefinition;
  level: Level;
}

/**
 * ステップ実行型のステージビュー。
 * - マウント時に attack.setup() を実行してアクターを配置
 * - 「次へ」ボタンを押すと steps[stepIdx] のアニメーションが流れ、stepIdx が進む
 * - 「リセット」ですべてを clearAll してから setup を再実行し、stepIdx を0に戻す
 * - level=beginner かつ attack.beginner が定義されていれば、setup 後にラベルとステップ文言を差し替える
 */
export function StageView({ attack, level }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageInstance = useRef<Stage | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  // この再構築カウンタで Stage を作り直す
  const [rebuildKey, setRebuildKey] = useState(0);

  const useBeginner = level === 'beginner' && !!attack.beginner;
  const beginner = attack.beginner;

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = new Stage(stageRef.current);
    attack.setup(stage);
    if (useBeginner && beginner) {
      Object.entries(beginner.actorLabels ?? {}).forEach(([id, label]) => stage.setActorLabel(id, label));
      Object.entries(beginner.groupLabels ?? {}).forEach(([id, label]) => stage.setGroupLabel(id, label));
      Object.entries(beginner.connectionLabels ?? {}).forEach(([id, label]) => stage.setConnectionLabel(id, label));
    }
    stageInstance.current = stage;
    return () => {
      stage.dispose();
      stageInstance.current = null;
    };
  }, [attack, rebuildKey, useBeginner, beginner]);

  // level 切替時はステージ再構築 + ステップ位置リセット
  useEffect(() => {
    setStepIdx(0);
    setRebuildKey((k) => k + 1);
  }, [level]);

  const total = attack.steps.length;
  const proCurrent = stepIdx > 0 ? attack.steps[stepIdx - 1] : null;
  const proNext = stepIdx < total ? attack.steps[stepIdx] : null;
  const beginnerCurrent = useBeginner && beginner && stepIdx > 0 ? beginner.steps[stepIdx - 1] : null;
  const beginnerNext = useBeginner && beginner && stepIdx < total ? beginner.steps[stepIdx] : null;
  const currentStep = beginnerCurrent ?? proCurrent;
  const nextStep = beginnerNext ?? proNext;
  const finished = stepIdx >= total;

  const onNext = () => {
    const stage = stageInstance.current;
    const proStep = proNext;
    if (!stage || !proStep) return;
    stage.clearTimers();
    stage.clearPackets();
    proStep.run(stage);
    setStepIdx(stepIdx + 1);
  };

  const onReset = () => {
    setStepIdx(0);
    setRebuildKey((k) => k + 1); // useEffect で setup 再実行
  };

  return (
    <div className="simulation-content">
      <div className="stage-frame">
        <div className="stage-corner-label">TOPOLOGY / LIVE</div>
        <div className="stage" ref={stageRef} role="img" aria-label={`${attack.meta.name}の攻撃フロー図`} />
      </div>
      <div className={`step-info${finished ? ' is-finished' : ''}`}>
        <div className="step-progress">
          ステップ {stepIdx} / {total}
          {finished && <span className="finished-tag">完了</span>}
        </div>
        <div className="step-title">
          {finished && currentStep
            ? <><span className="result-tag">結果</span>{currentStep.title}</>
            : currentStep
              ? `現在のフェーズ: ${currentStep.title}`
              : `次のフェーズ: ${nextStep?.title ?? ''}`}
        </div>
        <div className="step-desc">
          {currentStep ? currentStep.description : nextStep?.description}
        </div>
      </div>
      <div className="controls">
        <button type="button" onClick={onNext} disabled={finished}>
          <span aria-hidden="true">{stepIdx === 0 ? '▶' : '→'}</span>
          {stepIdx === 0 ? '開始' : finished ? '完了' : '次へ'}
        </button>
        <button type="button" className="secondary" onClick={onReset}>
          <span aria-hidden="true">↺</span>
          {finished ? '最初から見る' : 'リセット'}
        </button>
      </div>
    </div>
  );
}
