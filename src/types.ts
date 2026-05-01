import type { Stage } from './lib/Stage';

export interface AttackCategory {
  id: 'web' | 'mass' | 'target' | 'auth';
  label: string;
  color: string;
}

export interface InfoItem {
  head: string;
  body: string;
}

/** 攻撃の表示メタ情報。トップカタログとページヘッダで使用。 */
export interface AttackMeta {
  slug: string;
  name: string;
  nameEn: string;
  category: AttackCategory;
  summary: string;
  implemented: boolean;
}

/**
 * 1つの攻撃フェーズ。「次へ」ボタンで1ステップずつ進める。
 *
 * - title: 進行ステップの見出し(短文)
 * - description: ステップ中の状況説明文
 * - run: Stage に対する1フェーズ分のアニメーション
 */
export interface AttackStep {
  title: string;
  description: string;
  run: (stage: Stage) => void;
}

/** 各攻撃ページが提供する詳細情報とステップ列。 */
export interface AttackDefinition {
  meta: AttackMeta;
  caseStudy: string;
  damage: InfoItem[];
  defense: InfoItem[];
  devNote: InfoItem[];
  /** Stage に対してアクター登録を行う(初期状態の構築のみ)。 */
  setup: (stage: Stage) => void;
  /** ステップ列。順番に実行されることを前提に書く。 */
  steps: AttackStep[];
}

export type PictogramName =
  | 'user'
  | 'attacker'
  | 'server'
  | 'database'
  | 'browser'
  | 'email'
  | 'lock'
  | 'unlock'
  | 'document'
  | 'warning'
  | 'bot'
  | 'shield'
  | 'key'
  | 'cloud'
  | 'router'
  | 'firewall'
  | 'code'
  | 'mobile';
