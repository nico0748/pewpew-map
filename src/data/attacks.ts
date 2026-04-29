import type { AttackCategory, AttackMeta } from '../types';

export const Categories: Record<'WEB' | 'MASS' | 'TARGET' | 'AUTH' | 'AI', AttackCategory> = {
  WEB:    { id: 'web',    label: 'Webアプリケーションへの攻撃', color: '#3a86ff' },
  MASS:   { id: 'mass',   label: '不特定多数を狙う攻撃',         color: '#ff006e' },
  TARGET: { id: 'target', label: '特定組織を狙う攻撃',           color: '#fb5607' },
  AUTH:   { id: 'auth',   label: '認証情報を狙う攻撃',           color: '#8338ec' },
  AI:     { id: 'ai',     label: 'AI/機械学習システムへの攻撃',  color: '#06d6a0' }
};

export const AttacksMeta: AttackMeta[] = [
  {
    slug: 'sql-injection',
    name: 'SQLインジェクション',
    nameEn: 'SQL Injection',
    category: Categories.WEB,
    summary: 'Web入力フォーム経由で意図しないSQL文をDBに送り、情報を窃取・改ざんする攻撃。',
    implemented: true
  },
  {
    slug: 'xss',
    name: 'クロスサイトスクリプティング',
    nameEn: 'Cross-Site Scripting',
    category: Categories.WEB,
    summary: 'Webページに悪意あるスクリプトを埋め込み、閲覧者のブラウザ上で実行させる攻撃。',
    implemented: true
  },
  {
    slug: 'csrf',
    name: 'クロスサイトリクエストフォージェリ',
    nameEn: 'CSRF',
    category: Categories.WEB,
    summary: 'ログイン中の利用者に意図しないリクエストを送らせ、勝手に操作させる攻撃。',
    implemented: true
  },
  {
    slug: 'os-command-injection',
    name: 'OSコマンドインジェクション',
    nameEn: 'OS Command Injection',
    category: Categories.WEB,
    summary: 'アプリケーション経由でサーバOSの任意コマンドを実行させる攻撃。',
    implemented: true
  },
  {
    slug: 'directory-traversal',
    name: 'ディレクトリトラバーサル',
    nameEn: 'Directory Traversal',
    category: Categories.WEB,
    summary: '"../" 等のパス操作で公開すべきでないファイルにアクセスする攻撃。',
    implemented: true
  },
  {
    slug: 'session-hijacking',
    name: 'セッションハイジャック',
    nameEn: 'Session Hijacking',
    category: Categories.WEB,
    summary: 'セッションIDを盗み、本人になりすましてサービスを利用する攻撃。',
    implemented: true
  },
  {
    slug: 'ddos',
    name: 'DDoS攻撃',
    nameEn: 'DDoS',
    category: Categories.MASS,
    summary: '多数のホストから一斉にアクセスを送り、サーバを過負荷で停止させる攻撃。',
    implemented: true
  },
  {
    slug: 'phishing',
    name: 'フィッシング詐欺',
    nameEn: 'Phishing',
    category: Categories.MASS,
    summary: '正規サービスを装ったメール/サイトで認証情報や個人情報を盗む攻撃。',
    implemented: true
  },
  {
    slug: 'clickjacking',
    name: 'クリックジャッキング',
    nameEn: 'Clickjacking',
    category: Categories.MASS,
    summary: '透明なiframeを重ね、利用者の意図しないクリックを誘発する攻撃。',
    implemented: true
  },
  {
    slug: 'drive-by-download',
    name: 'ドライブバイダウンロード',
    nameEn: 'Drive-by Download',
    category: Categories.MASS,
    summary: 'Webサイト閲覧だけで自動的にマルウェアをダウンロード・実行させる攻撃。',
    implemented: true
  },
  {
    slug: 'targeted-attack',
    name: '標的型攻撃(APT)',
    nameEn: 'Targeted Attack',
    category: Categories.TARGET,
    summary: '特定組織を長期にわたり調査・侵入し、機密情報を窃取する攻撃。',
    implemented: true
  },
  {
    slug: 'watering-hole',
    name: '水飲み場型攻撃',
    nameEn: 'Watering Hole',
    category: Categories.TARGET,
    summary: '標的が頻繁に訪れるサイトを改ざんし、感染させる攻撃。',
    implemented: true
  },
  {
    slug: 'supply-chain',
    name: 'サプライチェーン攻撃',
    nameEn: 'Supply Chain',
    category: Categories.TARGET,
    summary: '取引先や利用OSS/ライブラリを起点に最終標的へ侵入する攻撃。',
    implemented: true
  },
  {
    slug: 'ransomware',
    name: 'ランサムウェア',
    nameEn: 'Ransomware',
    category: Categories.TARGET,
    summary: 'ファイルを暗号化して使用不能にし、復旧と引き換えに金銭を要求する攻撃。',
    implemented: true
  },
  {
    slug: 'brute-force',
    name: 'ブルートフォース',
    nameEn: 'Brute Force',
    category: Categories.AUTH,
    summary: 'パスワードを総当たりで試行し、認証突破を狙う攻撃。',
    implemented: true
  },
  {
    slug: 'password-list',
    name: 'パスワードリスト攻撃',
    nameEn: 'Credential Stuffing',
    category: Categories.AUTH,
    summary: '他サービスから漏洩した認証情報リストでログインを試みる攻撃。',
    implemented: true
  },
  {
    slug: 'mfa-fatigue',
    name: 'MFA疲労攻撃',
    nameEn: 'MFA Fatigue / Push Bombing',
    category: Categories.AUTH,
    summary: 'プッシュ通知型MFAを大量に送りつけ、被害者が誤って承認するのを狙う攻撃。',
    implemented: true
  },
  {
    slug: 'ssrf',
    name: 'サーバサイドリクエストフォージェリ',
    nameEn: 'SSRF',
    category: Categories.WEB,
    summary: 'サーバを踏み台に内部ネットワークやクラウドメタデータへアクセスさせる攻撃。',
    implemented: false
  },
  {
    slug: 'prompt-injection',
    name: 'プロンプトインジェクション',
    nameEn: 'Prompt Injection',
    category: Categories.AI,
    summary: 'LLMへの入力に命令を仕込み、システムプロンプトや制約を上書きさせる攻撃。',
    implemented: true
  },
  {
    slug: 'indirect-prompt-injection',
    name: '間接プロンプトインジェクション',
    nameEn: 'Indirect Prompt Injection',
    category: Categories.AI,
    summary: 'Webやドキュメントに命令を仕込み、LLMが取り込むことで間接的に制御を奪う攻撃。',
    implemented: true
  },
  {
    slug: 'jailbreak',
    name: 'ジェイルブレイク',
    nameEn: 'LLM Jailbreak',
    category: Categories.AI,
    summary: 'ロールプレイや符号化を駆使してAIの安全制限を回避し、禁止コンテンツを引き出す攻撃。',
    implemented: true
  },
  {
    slug: 'data-poisoning',
    name: 'データポイズニング',
    nameEn: 'Training Data Poisoning',
    category: Categories.AI,
    summary: '学習データに細工したサンプルを混入させ、モデルにバックドアやバイアスを埋め込む攻撃。',
    implemented: true
  },
  {
    slug: 'adversarial-examples',
    name: '敵対的サンプル攻撃',
    nameEn: 'Adversarial Examples',
    category: Categories.AI,
    summary: 'わずかな摂動を加えた入力でMLモデルを誤分類させる攻撃。標識誤認や検知回避に悪用。',
    implemented: true
  },
  {
    slug: 'model-extraction',
    name: 'モデル抽出攻撃',
    nameEn: 'Model Extraction',
    category: Categories.AI,
    summary: 'API経由で大量クエリを行い、独自AIモデルの挙動を複製・盗用する攻撃。',
    implemented: true
  },
  {
    slug: 'deepfake-fraud',
    name: 'ディープフェイク詐欺',
    nameEn: 'Deepfake Voice/Video Fraud',
    category: Categories.AI,
    summary: 'AI生成音声・映像で経営層になりすまし、送金や認証承認を引き出す詐欺。',
    implemented: true
  }
];
