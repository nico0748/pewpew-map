// アニメーション共通基盤
// 個別攻撃ページから呼び出して、アクター配置・パケット飛行・状態遷移などを宣言的に組み立てる。

import { Pictograms } from '../icons/pictograms.js';

export class Stage {
  constructor(rootSelector) {
    this.root = document.querySelector(rootSelector);
    if (!this.root) throw new Error(`Stage root not found: ${rootSelector}`);
    this.actors = new Map();
    this._timers = [];
  }

  // pict: 'attacker' | 'user' | 'server' | ... pictograms.js のキー
  // pos: { x: 0..1, y: 0..1 } の比率指定 (Stage 矩形に対する)
  addActor(id, pict, pos, label) {
    const el = document.createElement('div');
    el.className = 'actor';
    el.dataset.id = id;
    el.innerHTML = Pictograms[pict]() + (label ? `<div class="label">${label}</div>` : '');
    this.root.appendChild(el);
    this.actors.set(id, { el, pos });
    this._place(el, pos);
    return el;
  }

  setActorPict(id, pict, label) {
    const a = this.actors.get(id);
    if (!a) return;
    a.el.innerHTML = Pictograms[pict]() + (label ? `<div class="label">${label}</div>` : '');
  }

  flashActor(id, className = 'shake', duration = 600) {
    const a = this.actors.get(id);
    if (!a) return;
    a.el.classList.add(className);
    this._after(duration, () => a.el.classList.remove(className));
  }

  // パケット (or 文字列ペイロード) を fromId から toId へ飛ばす
  // opts: { duration, className, payload(text), onArrive }
  sendPacket(fromId, toId, opts = {}) {
    const from = this.actors.get(fromId);
    const to = this.actors.get(toId);
    if (!from || !to) return;
    const rect = this.root.getBoundingClientRect();
    const fromRect = from.el.getBoundingClientRect();
    const toRect = to.el.getBoundingClientRect();
    const sx = fromRect.left - rect.left + fromRect.width / 2;
    const sy = fromRect.top - rect.top + fromRect.height / 2;
    const tx = toRect.left - rect.left + toRect.width / 2;
    const ty = toRect.top - rect.top + toRect.height / 2;

    const p = document.createElement('div');
    p.className = 'packet ' + (opts.className || '');
    if (opts.payload) {
      p.classList.add('payload');
      p.textContent = opts.payload;
    }
    p.style.left = sx + 'px';
    p.style.top = sy + 'px';
    this.root.appendChild(p);

    // 強制リフロー後に transition
    requestAnimationFrame(() => {
      const dur = opts.duration ?? 800;
      p.style.transition = `left ${dur}ms linear, top ${dur}ms linear, opacity 200ms`;
      p.style.left = tx + 'px';
      p.style.top = ty + 'px';
    });

    this._after(opts.duration ?? 800, () => {
      p.style.opacity = '0';
      this._after(200, () => p.remove());
      if (typeof opts.onArrive === 'function') opts.onArrive();
    });
  }

  status(text) {
    const el = this.root.parentElement.querySelector('.status');
    if (el) el.textContent = text;
  }

  clearTimers() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
  }

  reset() {
    this.clearTimers();
    this.root.querySelectorAll('.packet').forEach(p => p.remove());
    this.actors.forEach(a => a.el.classList.remove('shake'));
  }

  _after(ms, fn) {
    const id = setTimeout(fn, ms);
    this._timers.push(id);
    return id;
  }

  _place(el, pos) {
    el.style.left = `calc(${pos.x * 100}% - 32px)`;
    el.style.top  = `calc(${pos.y * 100}% - 32px)`;
  }
}

// 一連のアニメーションシーケンスを宣言的に書くためのユーティリティ
export function sequence(steps) {
  let total = 0;
  const handles = [];
  steps.forEach(step => {
    const at = total + (step.delay || 0);
    handles.push(setTimeout(step.run, at));
    total = at + (step.hold || 0);
  });
  return {
    cancel() { handles.forEach(clearTimeout); }
  };
}
