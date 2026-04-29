// 攻撃カタログ - 各エントリは index.html / 個別ページの双方で利用される。
// 新しい攻撃を追加する場合はこの配列に追記するだけでトップページに反映される。

export const Categories = {
  WEB:    { id: 'web',     label: 'Webアプリケーションへの攻撃', color: '#3a86ff' },
  MASS:   { id: 'mass',    label: '不特定多数を狙う攻撃',         color: '#ff006e' },
  TARGET: { id: 'target',  label: '特定組織を狙う攻撃',           color: '#fb5607' },
  AUTH:   { id: 'auth',    label: '認証情報を狙う攻撃',           color: '#8338ec' }
};

export const Attacks = [
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
    implemented: false
  },
  {
    slug: 'session-hijacking',
    name: 'セッションハイジャック',
    nameEn: 'Session Hijacking',
    category: Categories.WEB,
    summary: 'セッションIDを盗み、本人になりすましてサービスを利用する攻撃。',
    implemented: false
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
    implemented: false
  },
  {
    slug: 'drive-by-download',
    name: 'ドライブバイダウンロード',
    nameEn: 'Drive-by Download',
    category: Categories.MASS,
    summary: 'Webサイト閲覧だけで自動的にマルウェアをダウンロード・実行させる攻撃。',
    implemented: false
  },
  {
    slug: 'targeted-attack',
    name: '標的型攻撃(APT)',
    nameEn: 'Targeted Attack',
    category: Categories.TARGET,
    summary: '特定組織を長期にわたり調査・侵入し、機密情報を窃取する攻撃。',
    implemented: false
  },
  {
    slug: 'watering-hole',
    name: '水飲み場型攻撃',
    nameEn: 'Watering Hole',
    category: Categories.TARGET,
    summary: '標的が頻繁に訪れるサイトを改ざんし、感染させる攻撃。',
    implemented: false
  },
  {
    slug: 'supply-chain',
    name: 'サプライチェーン攻撃',
    nameEn: 'Supply Chain',
    category: Categories.TARGET,
    summary: '取引先や利用OSS/ライブラリを起点に最終標的へ侵入する攻撃。',
    implemented: false
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
    implemented: false
  },
  {
    slug: 'password-list',
    name: 'パスワードリスト攻撃',
    nameEn: 'Credential Stuffing',
    category: Categories.AUTH,
    summary: '他サービスから漏洩した認証情報リストでログインを試みる攻撃。',
    implemented: false
  }
];
