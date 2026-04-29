import type { PictogramName } from '../types';

/**
 * Stage は Actor の中身を innerHTML で組み立てる。
 * React が StrictMode で createRoot を二重実行する際の描画揺れを避けるため、
 * 各アクターのSVGはここで直接マークアップ文字列として供給する。
 */
const svgs: Record<PictogramName, string> = {
  user: `
    <svg class="pict pict-user" viewBox="0 0 64 64" aria-label="利用者">
      <circle cx="32" cy="20" r="9" fill="currentColor"/>
      <path d="M14 54 C14 40, 50 40, 50 54 Z" fill="currentColor"/>
    </svg>`,

  attacker: `
    <svg class="pict pict-attacker" viewBox="0 0 64 64" aria-label="攻撃者">
      <circle cx="32" cy="20" r="9" fill="currentColor"/>
      <path d="M14 54 C14 40, 50 40, 50 54 Z" fill="currentColor"/>
      <path d="M22 18 L30 22 M42 18 L34 22" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <path d="M20 8 L26 14 M44 8 L38 14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,

  server: `
    <svg class="pict pict-server" viewBox="0 0 64 64" aria-label="サーバ">
      <rect x="12" y="10" width="40" height="14" rx="2" fill="currentColor"/>
      <rect x="12" y="28" width="40" height="14" rx="2" fill="currentColor"/>
      <rect x="12" y="46" width="40" height="10" rx="2" fill="currentColor"/>
      <circle cx="20" cy="17" r="2" fill="#fff"/>
      <circle cx="20" cy="35" r="2" fill="#fff"/>
      <circle cx="20" cy="51" r="1.5" fill="#fff"/>
    </svg>`,

  database: `
    <svg class="pict pict-db" viewBox="0 0 64 64" aria-label="データベース">
      <ellipse cx="32" cy="14" rx="20" ry="6" fill="currentColor"/>
      <path d="M12 14 V32 C12 36, 52 36, 52 32 V14" fill="currentColor"/>
      <path d="M12 32 V50 C12 54, 52 54, 52 50 V32" fill="currentColor" opacity="0.85"/>
      <ellipse cx="32" cy="32" rx="20" ry="6" fill="none" stroke="#fff" stroke-width="1.5"/>
    </svg>`,

  browser: `
    <svg class="pict pict-browser" viewBox="0 0 64 64" aria-label="ブラウザ">
      <rect x="6" y="10" width="52" height="44" rx="3" fill="currentColor"/>
      <rect x="6" y="10" width="52" height="10" rx="3" fill="#fff" opacity="0.4"/>
      <circle cx="12" cy="15" r="1.8" fill="#fff"/>
      <circle cx="18" cy="15" r="1.8" fill="#fff"/>
      <circle cx="24" cy="15" r="1.8" fill="#fff"/>
    </svg>`,

  email: `
    <svg class="pict pict-email" viewBox="0 0 64 64" aria-label="メール">
      <rect x="6" y="14" width="52" height="36" rx="3" fill="currentColor"/>
      <path d="M6 18 L32 38 L58 18" fill="none" stroke="#fff" stroke-width="2.5"/>
    </svg>`,

  lock: `
    <svg class="pict pict-lock" viewBox="0 0 64 64" aria-label="ロック">
      <path d="M20 28 V20 C20 12, 44 12, 44 20 V28" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="14" y="28" width="36" height="26" rx="3" fill="currentColor"/>
      <circle cx="32" cy="40" r="3" fill="#fff"/>
      <rect x="31" y="40" width="2" height="8" fill="#fff"/>
    </svg>`,

  unlock: `
    <svg class="pict pict-unlock" viewBox="0 0 64 64" aria-label="解錠">
      <path d="M20 28 V20 C20 12, 44 12, 44 20" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="14" y="28" width="36" height="26" rx="3" fill="currentColor"/>
      <circle cx="32" cy="40" r="3" fill="#fff"/>
    </svg>`,

  document: `
    <svg class="pict pict-doc" viewBox="0 0 64 64" aria-label="ドキュメント">
      <path d="M16 6 H42 L52 16 V58 H16 Z" fill="currentColor"/>
      <path d="M42 6 V16 H52" fill="none" stroke="#fff" stroke-width="1.5"/>
      <line x1="22" y1="26" x2="46" y2="26" stroke="#fff" stroke-width="2"/>
      <line x1="22" y1="34" x2="46" y2="34" stroke="#fff" stroke-width="2"/>
      <line x1="22" y1="42" x2="38" y2="42" stroke="#fff" stroke-width="2"/>
    </svg>`,

  warning: `
    <svg class="pict pict-warn" viewBox="0 0 64 64" aria-label="警告">
      <path d="M32 6 L60 56 H4 Z" fill="currentColor"/>
      <rect x="30" y="22" width="4" height="20" fill="#fff"/>
      <circle cx="32" cy="48" r="2.5" fill="#fff"/>
    </svg>`,

  bot: `
    <svg class="pict pict-bot" viewBox="0 0 64 64" aria-label="ボット">
      <rect x="14" y="18" width="36" height="32" rx="6" fill="currentColor"/>
      <circle cx="24" cy="32" r="3" fill="#fff"/>
      <circle cx="40" cy="32" r="3" fill="#fff"/>
      <rect x="22" y="42" width="20" height="3" rx="1.5" fill="#fff"/>
      <rect x="30" y="8" width="4" height="10" fill="currentColor"/>
      <circle cx="32" cy="8" r="3" fill="currentColor"/>
    </svg>`,

  shield: `
    <svg class="pict pict-shield" viewBox="0 0 64 64" aria-label="シールド">
      <path d="M32 6 L54 14 V32 C54 46, 32 58, 32 58 C32 58, 10 46, 10 32 V14 Z" fill="currentColor"/>
      <path d="M22 32 L30 40 L44 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  key: `
    <svg class="pict pict-key" viewBox="0 0 64 64" aria-label="鍵">
      <circle cx="20" cy="32" r="10" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="28" y="30" width="28" height="4" fill="currentColor"/>
      <rect x="46" y="30" width="4" height="10" fill="currentColor"/>
      <rect x="52" y="30" width="4" height="8" fill="currentColor"/>
    </svg>`
};

export function pictogramSvg(name: PictogramName): string {
  return svgs[name];
}

export function actorMarkup(name: PictogramName, label?: string): string {
  return svgs[name] + (label ? `<div class="label">${label}</div>` : '');
}
