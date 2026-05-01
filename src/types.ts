import type { Stage } from './lib/Stage';

export interface AttackCategory {
  id: 'web' | 'mass' | 'target' | 'auth' | 'ai';
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

/** 表示モード。pro: 専門家向け / beginner: 初学者(バイブコーダー)向け */
export type Level = 'pro' | 'beginner';

/**
 * 初学者向け(beginner)コンテンツ。pro 版と並列に保持し、トグルで切り替える。
 * アニメーション(setup/run)は pro と共有し、テキストとラベルだけを差し替える。
 */
export interface BeginnerContent {
  /** カタログ・ヘッダ等で表示する短い説明(meta.summary を上書き) */
  summary: string;
  caseStudy: string;
  damage: InfoItem[];
  defense: InfoItem[];
  devNote: InfoItem[];
  /** 「自分のアプリにこんな機能があれば要注意」のチェックリスト(beginner 用文言) */
  appliesIf?: InfoItem[];
  /** pro の steps と同じ長さ。run は共有なので title/description のみ。 */
  steps: Array<{ title: string; description: string }>;
  /** setup 後に上書きするアクター/グループ/接続のラベル。キーは setup で割り当てた id。 */
  actorLabels?: Record<string, string>;
  groupLabels?: Record<string, string>;
  connectionLabels?: Record<string, string>;
}

/** 各攻撃ページが提供する詳細情報とステップ列。 */
export interface AttackDefinition {
  meta: AttackMeta;
  caseStudy: string;
  damage: InfoItem[];
  defense: InfoItem[];
  devNote: InfoItem[];
  /**
   * 「自分のアプリにこんな機能/実装があればこの攻撃に該当」というチェックリスト。
   * 利用者が自分のアプリ内容と照らして、その攻撃が自分事かを素早く判断するためのもの。
   */
  appliesIf: InfoItem[];
  /** 初学者向けコンテンツ。未提供なら pro のまま表示する。 */
  beginner?: BeginnerContent;
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
