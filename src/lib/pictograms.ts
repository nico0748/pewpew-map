import type { PictogramName } from '../types';

/**
 * Stage は Actor の中身を innerHTML で組み立てる。
 * React が StrictMode で createRoot を二重実行する際の描画揺れを避けるため、
 * 各アクターのSVGはここで直接マークアップ文字列として供給する。
 *
 * デザイン方針:
 *  - ISO / 交通ピクトグラム風の洗練されたジオメトリック表現
 *  - 一貫したストローク幅 (2px) とラウンドキャップ/ジョイン
 *  - 64x64 viewBox 内での適切なマージンとバランス
 *  - 最小限の装飾、最大限の視認性
 */
const svgs: Record<PictogramName, string> = {
  /* ── 人物系 ─────────────────────────────── */

  user: `
    <svg class="pict pict-user" viewBox="0 0 64 64" aria-label="利用者">
      <circle cx="32" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M16 56 C16 40 22 32 32 32 C42 32 48 40 48 56" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="56" x2="48" y2="56" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

  attacker: `
    <svg class="pict pict-attacker" viewBox="0 0 64 64" aria-label="攻撃者">
      <!-- フード -->
      <path d="M18 30 C18 14 46 14 46 30" fill="currentColor" opacity="0.25"/>
      <path d="M18 30 C18 14 46 14 46 30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 顔 -->
      <circle cx="32" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <!-- 体 -->
      <path d="M18 56 C18 42 24 36 32 36 C40 36 46 42 46 56" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="18" y1="56" x2="46" y2="56" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 目(鋭い) -->
      <line x1="27" y1="23" x2="30" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="37" y1="23" x2="34" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

  /* ── インフラ系 ──────────────────────────── */

  server: `
    <svg class="pict pict-server" viewBox="0 0 64 64" aria-label="サーバ">
      <!-- 筐体 -->
      <rect x="12" y="8" width="40" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="12" y="26" width="40" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="12" y="44" width="40" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- インジケータ -->
      <circle cx="20" cy="16" r="2" fill="currentColor"/>
      <line x1="26" y1="16" x2="44" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <circle cx="20" cy="34" r="2" fill="currentColor"/>
      <line x1="26" y1="34" x2="44" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <circle cx="20" cy="50" r="1.5" fill="currentColor"/>
      <line x1="26" y1="50" x2="44" y2="50" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    </svg>`,

  database: `
    <svg class="pict pict-db" viewBox="0 0 64 64" aria-label="データベース">
      <ellipse cx="32" cy="16" rx="18" ry="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M14 16 V30" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 16 V30" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="32" cy="30" rx="18" ry="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M14 30 V46" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 30 V46" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="32" cy="46" rx="18" ry="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- 行データ表現 -->
      <line x1="22" y1="22" x2="42" y2="22" stroke="currentColor" stroke-width="1" opacity="0.35" stroke-linecap="round"/>
      <line x1="22" y1="37" x2="42" y2="37" stroke="currentColor" stroke-width="1" opacity="0.35" stroke-linecap="round"/>
    </svg>`,

  browser: `
    <svg class="pict pict-browser" viewBox="0 0 64 64" aria-label="ブラウザ">
      <rect x="6" y="10" width="52" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- タイトルバー -->
      <line x1="6" y1="22" x2="58" y2="22" stroke="currentColor" stroke-width="2"/>
      <circle cx="14" cy="16" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="22" cy="16" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="30" cy="16" r="2" fill="currentColor" opacity="0.25"/>
      <!-- URL バー -->
      <rect x="36" y="13.5" width="18" height="5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
      <!-- コンテンツエリア -->
      <line x1="14" y1="30" x2="50" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.3" stroke-linecap="round"/>
      <line x1="14" y1="36" x2="42" y2="36" stroke="currentColor" stroke-width="1.5" opacity="0.3" stroke-linecap="round"/>
      <line x1="14" y1="42" x2="46" y2="42" stroke="currentColor" stroke-width="1.5" opacity="0.3" stroke-linecap="round"/>
    </svg>`,

  cloud: `
    <svg class="pict pict-cloud" viewBox="0 0 64 64" aria-label="クラウド">
      <path d="M20 44 C10 44 8 34 16 30 C14 20 28 16 36 22 C42 16 56 22 52 34 C58 36 56 46 48 46 H20 Z"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <!-- 上向き矢印(データアップロード) -->
      <line x1="32" y1="42" x2="32" y2="30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <polyline points="27,34 32,29 37,34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
    </svg>`,

  router: `
    <svg class="pict pict-router" viewBox="0 0 64 64" aria-label="ルータ">
      <!-- 筐体 -->
      <rect x="8" y="34" width="48" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- ランプ -->
      <circle cx="18" cy="42" r="2.5" fill="currentColor" opacity="0.7"/>
      <circle cx="27" cy="42" r="2.5" fill="currentColor" opacity="0.45"/>
      <!-- アンテナ -->
      <line x1="32" y1="30" x2="32" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- 電波 -->
      <path d="M24 22 C28 16 36 16 40 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 16 C24 6 40 6 46 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
      <!-- ポート -->
      <rect x="38" y="39" width="5" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <rect x="46" y="39" width="5" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
    </svg>`,

  firewall: `
    <svg class="pict pict-firewall" viewBox="0 0 64 64" aria-label="ファイアウォール">
      <!-- 壁 -->
      <rect x="8" y="10" width="48" height="44" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- レンガパターン -->
      <line x1="8" y1="22" x2="56" y2="22" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="8" y1="34" x2="56" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="8" y1="46" x2="56" y2="46" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="22" y1="10" x2="22" y2="22" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="42" y1="10" x2="42" y2="22" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="32" y1="22" x2="32" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="16" y1="34" x2="16" y2="46" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="38" y1="34" x2="38" y2="46" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="26" y1="46" x2="26" y2="54" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <line x1="48" y1="46" x2="48" y2="54" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      <!-- シールドマーク -->
      <path d="M28 26 L32 24 L36 26 V32 C36 35 32 38 32 38 C32 38 28 35 28 32 Z" fill="currentColor" opacity="0.35"/>
    </svg>`,

  /* ── コミュニケーション系 ────────────────── */

  email: `
    <svg class="pict pict-email" viewBox="0 0 64 64" aria-label="メール">
      <rect x="6" y="14" width="52" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="6,18 32,36 58,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <!-- 折り返し線 -->
      <line x1="6" y1="46" x2="22" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.3" stroke-linecap="round"/>
      <line x1="58" y1="46" x2="42" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.3" stroke-linecap="round"/>
    </svg>`,

  /* ── セキュリティ系 ──────────────────────── */

  lock: `
    <svg class="pict pict-lock" viewBox="0 0 64 64" aria-label="ロック">
      <path d="M20 28 V20 C20 12 24 6 32 6 C40 6 44 12 44 20 V28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="14" y="28" width="36" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <!-- 鍵穴 -->
      <circle cx="32" cy="39" r="3.5" fill="currentColor"/>
      <path d="M30 42 L29 50 H35 L34 42" fill="currentColor"/>
    </svg>`,

  unlock: `
    <svg class="pict pict-unlock" viewBox="0 0 64 64" aria-label="解錠">
      <path d="M20 28 V20 C20 12 24 6 32 6 C40 6 44 12 44 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="14" y="28" width="36" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <!-- 鍵穴(開放) -->
      <circle cx="32" cy="40" r="3" fill="currentColor" opacity="0.5"/>
    </svg>`,

  shield: `
    <svg class="pict pict-shield" viewBox="0 0 64 64" aria-label="シールド">
      <path d="M32 6 L54 16 V34 C54 46 32 58 32 58 C32 58 10 46 10 34 V16 Z"
            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- チェックマーク -->
      <polyline points="22,34 30,42 44,26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  key: `
    <svg class="pict pict-key" viewBox="0 0 64 64" aria-label="鍵">
      <!-- リング部 -->
      <circle cx="20" cy="26" r="10" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="20" cy="26" r="4" fill="currentColor" opacity="0.3"/>
      <!-- シャフト -->
      <line x1="30" y1="26" x2="54" y2="50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <!-- 歯 -->
      <line x1="42" y1="38" x2="48" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="48" y1="44" x2="54" y2="38" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

  /* ── ドキュメント系 ──────────────────────── */

  document: `
    <svg class="pict pict-doc" viewBox="0 0 64 64" aria-label="ドキュメント">
      <path d="M16 6 H40 L50 16 V58 H16 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="40,6 40,16 50,16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <!-- テキスト行 -->
      <line x1="22" y1="26" x2="44" y2="26" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
      <line x1="22" y1="33" x2="44" y2="33" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
      <line x1="22" y1="40" x2="38" y2="40" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
      <line x1="22" y1="47" x2="42" y2="47" stroke="currentColor" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
    </svg>`,

  code: `
    <svg class="pict pict-code" viewBox="0 0 64 64" aria-label="コード">
      <rect x="6" y="10" width="52" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- ターミナルバー -->
      <line x1="6" y1="20" x2="58" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="13" cy="15" r="1.5" fill="currentColor" opacity="0.5"/>
      <circle cx="19" cy="15" r="1.5" fill="currentColor" opacity="0.4"/>
      <circle cx="25" cy="15" r="1.5" fill="currentColor" opacity="0.3"/>
      <!-- < > 括弧 -->
      <polyline points="22,28 14,36 22,44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="42,28 50,36 42,44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- スラッシュ -->
      <line x1="36" y1="26" x2="28" y2="46" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

  /* ── 警告/ボット ─────────────────────────── */

  warning: `
    <svg class="pict pict-warn" viewBox="0 0 64 64" aria-label="警告">
      <path d="M32 6 L58 54 H6 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <!-- ! マーク -->
      <line x1="32" y1="24" x2="32" y2="40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="47" r="2.5" fill="currentColor"/>
    </svg>`,

  bot: `
    <svg class="pict pict-bot" viewBox="0 0 64 64" aria-label="ボット">
      <!-- アンテナ -->
      <line x1="32" y1="10" x2="32" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="32" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- 頭部 -->
      <rect x="14" y="18" width="36" height="24" rx="6" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- 目 -->
      <circle cx="24" cy="28" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="24" cy="28" r="1.5" fill="currentColor"/>
      <circle cx="40" cy="28" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="40" cy="28" r="1.5" fill="currentColor"/>
      <!-- 口 -->
      <line x1="24" y1="36" x2="40" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="28" y1="36" x2="28" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="32" y1="36" x2="32" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="36" y1="36" x2="36" y2="36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- 体 -->
      <rect x="20" y="44" width="24" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- 腕 -->
      <line x1="14" y1="48" x2="20" y2="48" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="44" y1="48" x2="50" y2="48" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

  /* ── デバイス系 ──────────────────────────── */

  mobile: `
    <svg class="pict pict-mobile" viewBox="0 0 64 64" aria-label="モバイル">
      <rect x="16" y="4" width="32" height="56" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- スクリーン -->
      <rect x="20" y="12" width="24" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
      <!-- スピーカー -->
      <line x1="28" y1="8" x2="36" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <!-- ホームバー -->
      <line x1="26" y1="54" x2="38" y2="54" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    </svg>`
};

export function pictogramSvg(name: PictogramName): string {
  return svgs[name];
}

export function actorMarkup(name: PictogramName, label?: string): string {
  return svgs[name] + (label ? `<div class="label">${label}</div>` : '');
}
