import type { ComponentType } from 'react';
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

/** 各攻撃ページが提供する詳細情報とアニメーション。 */
export interface AttackDefinition {
  meta: AttackMeta;
  caseStudy: string;
  damage: InfoItem[];
  defense: InfoItem[];
  devNote: InfoItem[];
  /** Stage に対してアクター登録 + シナリオ開始ハンドラを返す。 */
  setup: (stage: Stage) => () => void;
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
  | 'key';

export type PictogramComponent = ComponentType<{ className?: string }>;
