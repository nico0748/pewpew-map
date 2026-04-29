import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Stage } from '../lib/Stage';
import { Pictograms } from '../lib/pictograms';
import type { PictogramName } from '../types';

interface StageViewProps {
  /** Stageインスタンスにアクター等を登録し、再生開始関数を返す。 */
  setup: (stage: Stage) => () => void;
  initialStatus?: string;
}

export function StageView({ setup, initialStatus = '準備完了' }: StageViewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const stageInstance = useRef<Stage | null>(null);
  const playFnRef = useRef<(() => void) | null>(null);
  const actorRoots = useRef<Root[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!stageRef.current) return;

    const renderActor = (slot: HTMLElement, pict: PictogramName, label?: string) => {
      const Pict = Pictograms[pict];
      const root = createRoot(slot);
      actorRoots.current.push(root);
      root.render(
        <>
          <Pict />
          {label && <div className="label">{label}</div>}
        </>
      );
    };

    const stage = new Stage(stageRef.current, statusRef.current, renderActor);
    stageInstance.current = stage;
    playFnRef.current = setup(stage);
    setTick((n) => n + 1);

    return () => {
      stage.dispose();
      // unmount portals
      queueMicrotask(() => {
        actorRoots.current.forEach((r) => r.unmount());
        actorRoots.current = [];
      });
      stageInstance.current = null;
      playFnRef.current = null;
    };
  }, [setup]);

  const onPlay = () => {
    stageInstance.current?.reset();
    playFnRef.current?.();
  };
  const onReset = () => {
    stageInstance.current?.reset();
    if (statusRef.current) statusRef.current.textContent = initialStatus;
  };

  return (
    <>
      <div className="stage" ref={stageRef} />
      <div className="controls">
        <button type="button" onClick={onPlay}>▶ 再生</button>
        <button type="button" className="secondary" onClick={onReset}>リセット</button>
        <span className="status" ref={statusRef}>{initialStatus}</span>
      </div>
    </>
  );
}
