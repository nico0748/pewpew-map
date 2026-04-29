import type { PictogramName } from '../types';
import { actorMarkup } from './pictograms';

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
 * 攻撃シナリオのアクター/パケット/状態表示を扱う軽量アニメーション基盤。
 *
 * Reactのレンダリングループに乗らないよう、アクターは innerHTML で直接組み立てる。
 * これによりStrictModeの二重マウントでも描画状態が安定し、ピクトグラムが
 * 必ず即時に表示される。
 */
export class Stage {
  private root: HTMLElement;
  private actors = new Map<string, HTMLElement>();
  private timers: number[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
  }

  addActor(id: string, opts: ActorOptions): void {
    const el = document.createElement('div');
    el.className = 'actor';
    el.dataset.id = id;
    el.style.left = `calc(${opts.pos.x * 100}% - 32px)`;
    el.style.top = `calc(${opts.pos.y * 100}% - 32px)`;
    el.innerHTML = actorMarkup(opts.pict, opts.label);
    this.root.appendChild(el);
    this.actors.set(id, el);
  }

  setActorPict(id: string, pict: PictogramName, label?: string): void {
    const el = this.actors.get(id);
    if (!el) return;
    el.innerHTML = actorMarkup(pict, label);
  }

  flashActor(id: string, className = 'shake', duration = 600): void {
    const el = this.actors.get(id);
    if (!el) return;
    el.classList.add(className);
    this.after(duration, () => el.classList.remove(className));
  }

  sendPacket(fromId: string, toId: string, opts: PacketOptions = {}): void {
    const from = this.actors.get(fromId);
    const to = this.actors.get(toId);
    if (!from || !to) return;
    const rect = this.root.getBoundingClientRect();
    const fr = from.getBoundingClientRect();
    const tr = to.getBoundingClientRect();
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

  /** 現フェーズ中だけ流れているパケットを消す。アクターは保持。 */
  clearPackets(): void {
    this.root.querySelectorAll('.packet').forEach((p) => p.remove());
    this.actors.forEach((el) => el.classList.remove('shake'));
  }

  /** 全アクターを除去。 */
  clearActors(): void {
    this.actors.forEach((el) => el.remove());
    this.actors.clear();
  }

  clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  /** Stage全体をリセット。再生用ハンドラを再構築する前段で利用する。 */
  resetAll(): void {
    this.clearTimers();
    this.clearPackets();
    this.clearActors();
  }

  after(ms: number, fn: () => void): number {
    const id = window.setTimeout(fn, ms);
    this.timers.push(id);
    return id;
  }

  dispose(): void {
    this.clearTimers();
    this.clearActors();
    this.root.querySelectorAll('.packet').forEach((p) => p.remove());
  }
}
