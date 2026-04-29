import type { PictogramName } from '../types';

interface ActorPos {
  x: number; // 0..1
  y: number; // 0..1
}

export interface ActorOptions {
  pict: PictogramName;
  pos: ActorPos;
  label?: string;
}

interface PacketOptions {
  duration?: number;
  className?: string;
  payload?: string;
  onArrive?: () => void;
}

/**
 * 攻撃シナリオのアニメーションを動かすためのDOM操作ライブラリ。
 * React側では useEffect でインスタンスを生成し、unmount時に dispose() を呼ぶ。
 */
export class Stage {
  private root: HTMLElement;
  private actors = new Map<string, { el: HTMLElement }>();
  private timers: number[] = [];
  private statusEl: HTMLElement | null;
  private renderActor: (slot: HTMLElement, pict: PictogramName, label?: string) => void;

  constructor(
    root: HTMLElement,
    statusEl: HTMLElement | null,
    renderActor: (slot: HTMLElement, pict: PictogramName, label?: string) => void
  ) {
    this.root = root;
    this.statusEl = statusEl;
    this.renderActor = renderActor;
  }

  addActor(id: string, opts: ActorOptions): void {
    const el = document.createElement('div');
    el.className = 'actor';
    el.dataset.id = id;
    el.style.left = `calc(${opts.pos.x * 100}% - 32px)`;
    el.style.top = `calc(${opts.pos.y * 100}% - 32px)`;
    this.renderActor(el, opts.pict, opts.label);
    this.root.appendChild(el);
    this.actors.set(id, { el });
  }

  setActorPict(id: string, pict: PictogramName, label?: string): void {
    const a = this.actors.get(id);
    if (!a) return;
    a.el.innerHTML = '';
    this.renderActor(a.el, pict, label);
  }

  flashActor(id: string, className = 'shake', duration = 600): void {
    const a = this.actors.get(id);
    if (!a) return;
    a.el.classList.add(className);
    this.after(duration, () => a.el.classList.remove(className));
  }

  sendPacket(fromId: string, toId: string, opts: PacketOptions = {}): void {
    const from = this.actors.get(fromId);
    const to = this.actors.get(toId);
    if (!from || !to) return;
    const rect = this.root.getBoundingClientRect();
    const fr = from.el.getBoundingClientRect();
    const tr = to.el.getBoundingClientRect();
    const sx = fr.left - rect.left + fr.width / 2;
    const sy = fr.top - rect.top + fr.height / 2;
    const tx = tr.left - rect.left + tr.width / 2;
    const ty = tr.top - rect.top + tr.height / 2;

    const p = document.createElement('div');
    p.className = 'packet ' + (opts.className || '');
    if (opts.payload) {
      p.classList.add('payload');
      p.textContent = opts.payload;
    }
    p.style.left = `${sx}px`;
    p.style.top = `${sy}px`;
    this.root.appendChild(p);

    requestAnimationFrame(() => {
      const dur = opts.duration ?? 800;
      p.style.transition = `left ${dur}ms linear, top ${dur}ms linear, opacity 200ms`;
      p.style.left = `${tx}px`;
      p.style.top = `${ty}px`;
    });

    this.after(opts.duration ?? 800, () => {
      p.style.opacity = '0';
      this.after(200, () => p.remove());
      opts.onArrive?.();
    });
  }

  status(text: string): void {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  reset(): void {
    this.clearTimers();
    this.root.querySelectorAll('.packet').forEach((p) => p.remove());
    this.actors.forEach((a) => a.el.classList.remove('shake'));
  }

  clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  after(ms: number, fn: () => void): number {
    const id = window.setTimeout(fn, ms);
    this.timers.push(id);
    return id;
  }

  dispose(): void {
    this.clearTimers();
    this.actors.forEach((a) => a.el.remove());
    this.actors.clear();
    this.root.querySelectorAll('.packet').forEach((p) => p.remove());
  }
}

/** 連続したアニメーション手順を宣言的に書くためのヘルパ。 */
export interface SequenceStep {
  delay?: number;
  hold?: number;
  run: () => void;
}

export function runSequence(stage: Stage, steps: SequenceStep[]): () => void {
  let total = 0;
  const handles: number[] = [];
  steps.forEach((step) => {
    const at = total + (step.delay || 0);
    handles.push(stage.after(at, step.run));
    total = at + (step.hold || 0);
  });
  return () => handles.forEach((h) => clearTimeout(h));
}
