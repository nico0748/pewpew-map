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

export interface GroupOptions {
  /** 左上 (0..1) と幅・高さ (0..1) で領域を指定する。 */
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  /** 'attack' | 'victim' | 'infra' | 'neutral' などで配色を切り替える。 */
  variant?: 'attack' | 'victim' | 'infra' | 'neutral';
}

export interface ConnectionOptions {
  /** 既存関係の表現に。デフォルト false (実線)。 */
  dashed?: boolean;
  /** 'flow' は経路の主導線、'aux' は補助線、'attack' は攻撃経路。 */
  variant?: 'flow' | 'aux' | 'attack';
  /** 線の中央付近に出すラベル。 */
  label?: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

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
  private positions = new Map<string, ActorPos>();
  private groups: HTMLElement[] = [];
  private connectionsSvg: SVGSVGElement | null = null;
  private timers: number[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.classList.add('stage-root');
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
    this.positions.set(id, opts.pos);
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

  /** ステージ上に「囲い」を描画する。背景に薄く敷かれて要素群を視覚的にまとめる。 */
  addGroup(opts: GroupOptions): void {
    const div = document.createElement('div');
    div.className = `group group-${opts.variant ?? 'neutral'}`;
    div.style.left = `${opts.x * 100}%`;
    div.style.top = `${opts.y * 100}%`;
    div.style.width = `${opts.w * 100}%`;
    div.style.height = `${opts.h * 100}%`;
    if (opts.label) {
      const label = document.createElement('div');
      label.className = 'group-label';
      label.textContent = opts.label;
      div.appendChild(label);
    }
    this.root.appendChild(div);
    this.groups.push(div);
  }

  /** アクター同士を結ぶ静的な線を描画する。pos % を使うのでレイアウト前後に依存しない。 */
  addConnection(fromId: string, toId: string, opts: ConnectionOptions = {}): void {
    const fromPos = this.positions.get(fromId);
    const toPos = this.positions.get(toId);
    if (!fromPos || !toPos) return;
    const svg = this.ensureConnectionsSvg();
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', `${fromPos.x * 100}%`);
    line.setAttribute('y1', `${fromPos.y * 100}%`);
    line.setAttribute('x2', `${toPos.x * 100}%`);
    line.setAttribute('y2', `${toPos.y * 100}%`);
    line.setAttribute('class', `conn conn-${opts.variant ?? 'flow'}${opts.dashed ? ' dashed' : ''}`);
    svg.appendChild(line);

    if (opts.label) {
      const text = document.createElementNS(SVG_NS, 'text');
      const mx = (fromPos.x + toPos.x) / 2;
      const my = (fromPos.y + toPos.y) / 2;
      text.setAttribute('x', `${mx * 100}%`);
      text.setAttribute('y', `${my * 100}%`);
      text.setAttribute('class', 'conn-label');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '-4');
      text.textContent = opts.label;
      svg.appendChild(text);
    }
  }

  private ensureConnectionsSvg(): SVGSVGElement {
    if (this.connectionsSvg) return this.connectionsSvg;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('connections');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'none');
    this.root.appendChild(svg);
    this.connectionsSvg = svg;
    return svg;
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

  /** 全アクター・グループ・接続を除去。 */
  clearActors(): void {
    this.actors.forEach((el) => el.remove());
    this.actors.clear();
    this.positions.clear();
    this.groups.forEach((g) => g.remove());
    this.groups = [];
    if (this.connectionsSvg) {
      this.connectionsSvg.remove();
      this.connectionsSvg = null;
    }
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
