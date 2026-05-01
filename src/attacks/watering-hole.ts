import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'watering-hole')!;

export const wateringHole: AttackDefinition = {
  meta,
  caseStudy:
    '標的の業界が頻繁に閲覧する業界団体サイト・専門メディア・取引先サイトを改ざんし、訪問者(=標的組織の従業員)に絞ってマルウェア配信する手口。米国の防衛・エネルギー・金融業界を対象とした事例(2012年以降)が代表例。',
  damage: [
    { head: '標的組織の選別感染:', body: '汎用的な攻撃と異なり、特定IP/UAの組織だけを狙って感染させる。' },
    { head: '長期潜伏:', body: '感染後、APT同様の継続侵害につながる。' },
    { head: '正規サイト閲覧で感染:', body: '利用者の警戒心が薄く検知が遅れる。' },
    { head: 'サプライチェーンへ波及:', body: '改ざんされたサイトの所有者にも責任が発生。' }
  ],
  defense: [
    { head: 'ブラウザ/プラグイン最新化:', body: '改ざんサイトは脆弱性経由で実行する。最新化が第一の壁。' },
    { head: 'EDR + Webプロキシ:', body: '不審ダウンロード/C2通信を行動検知で遮断。' },
    { head: 'DNSフィルタリング:', body: '既知の攻撃インフラへの接続を組織レベルで遮断。' },
    { head: '改ざん監視:', body: '自社サイトの差分監視・WAF・ログ監視で改ざんを早期検知。' },
    { head: 'CDN/WAF/SRI:', body: '配信経路の改ざん耐性を高める。' }
  ],
  devNote: [
    { head: 'CMSの脆弱性管理:', body: 'WordPress等のCMSは改ざんの主要ターゲット。プラグイン含めた継続更新を運用に組み込む。' },
    { head: 'ファイル整合性監視 (FIM):', body: '本番Webルート配下の改変をリアルタイム検知し、即時アラート。' },
    { head: '管理者アクセスの分離:', body: '管理画面の公開はIP制限+MFA。共用パスワードを使わない。' },
    { head: '広告/タグ/外部スクリプト:', body: '埋め込みJSは "改ざんの侵入口"。SRI / CSP / sandboxを徹底。' },
    { head: '監査ログのSaaS集約:', body: 'サーバ侵害でログを消されても外部に残るよう、ログを即時送出。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'targets', x: 0.46, y: 0.02, w: 0.20, h: 0.62, label: '対象組織', variant: 'victim' });
    stage.addGroup({ id: 'attacker-infra', x: 0.74, y: 0.16, w: 0.22, h: 0.36, label: '攻撃者ペイロード置き場', variant: 'attack' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('site',     { pict: 'browser',  pos: { x: 0.30, y: 0.5  }, label: '業界サイト(改ざん)' });
    stage.addActor('emp1',     { pict: 'user',     pos: { x: 0.55, y: 0.18 }, label: '対象組織A 従業員' });
    stage.addActor('emp2',     { pict: 'user',     pos: { x: 0.55, y: 0.50 }, label: '対象組織B 従業員' });
    stage.addActor('outsider', { pict: 'user',     pos: { x: 0.55, y: 0.82 }, label: '無関係な利用者' });
    stage.addActor('payload',  { pict: 'document', pos: { x: 0.85, y: 0.34 }, label: 'マルウェア' });
  },
  steps: [
    {
      title: '業界サイトを改ざん',
      description: '攻撃者が、標的組織の従業員がよく訪問する業界専門サイトをこっそり改ざんする。',
      run: (stage) => {
        stage.sendPacket('attacker', 'site', { duration: 1100, payload: '改ざんJS埋め込み' });
        stage.after(900, () => stage.flashActor('site', 'shake', 700));
      }
    },
    {
      title: '従業員/外部の人がサイトを訪問',
      description: '対象組織の従業員も無関係な利用者も、いつも通りそのサイトを開く。',
      run: (stage) => {
        stage.sendPacket('emp1',     'site', { duration: 1000, className: 'benign', payload: 'GET /' });
        stage.sendPacket('emp2',     'site', { duration: 1000, className: 'benign', payload: 'GET /' });
        stage.sendPacket('outsider', 'site', { duration: 1000, className: 'benign', payload: 'GET /' });
      }
    },
    {
      title: 'IP/UAでフィルタしてペイロード配信',
      description: '改ざんスクリプトがIP/UAを判定し、標的組織の閲覧者だけにマルウェアを送る。',
      run: (stage) => {
        stage.sendPacket('site', 'payload', { duration: 800, payload: 'select target' });
        stage.after(700, () => {
          stage.sendPacket('payload', 'emp1', { duration: 1000, payload: 'exploit + dropper' });
          stage.sendPacket('payload', 'emp2', { duration: 1000, payload: 'exploit + dropper' });
        });
      }
    },
    {
      title: '対象組織のみが感染',
      description: '対象組織の端末は感染、無関係な利用者は何も起こらない。検知をすり抜けやすい。',
      run: (stage) => {
        stage.flashActor('emp1', 'shake', 900);
        stage.flashActor('emp2', 'shake', 900);
      }
    }
  ],
  beginner: {
    summary:
      '狙いたい組織の人がよく見るサイト(=「水飲み場」)を先に汚染しておいて、そこに来た特定の人だけにウイルスを送り込む攻撃。',
    caseStudy:
      'ライオンが「シマウマがよく来る水飲み場」で待ち伏せするように、攻撃者は標的組織がよく見る業界団体のサイト・専門メディア・取引先サイトをこっそり改ざんし、訪問者のうち「狙った組織のIPアドレス」の人にだけウイルスを配ります。米国の防衛・エネルギー・金融業界を対象とした事件(2012年以降)が代表例です。',
    damage: [
      {
        head: '狙った組織だけ感染:',
        body: '無差別ではなく、特定の会社の人だけを選んで感染させるので、被害が見つかりにくい。'
      },
      {
        head: '長期にわたって潜まれる:',
        body: '感染後はAPT(長期型の標的攻撃)と同じく、長期間こっそり潜伏されます。'
      },
      {
        head: '「いつものサイト」だから警戒されない:',
        body: '改ざんされた相手は普段使っている正規サイトなので、利用者は怪しいと思いません。検知も遅れます。'
      },
      {
        head: '改ざんされた側のサイト所有者にも責任:',
        body: '罠の発信源にされたサイト運営者にも責任が発生し、ブランドに傷が付きます。'
      }
    ],
    defense: [
      {
        head: 'ブラウザ・プラグインを最新に:',
        body: '改ざんサイトはブラウザの弱点を突いて動きます。自動更新を有効にして弱点をふさぎます。'
      },
      {
        head: '端末の振る舞い監視 + Webプロキシ:',
        body: 'EDR(端末の挙動を見張るソフト)と、社内→外部の通信を一元監視するプロキシを組み合わせ、不審なダウンロードや外部通信を遮断します。'
      },
      {
        head: 'DNSフィルタ:',
        body: '既知の攻撃用ドメインへの名前解決自体を社内全体で遮断する仕組みを入れます。'
      },
      {
        head: '自社サイトの改ざん監視:',
        body: '自社サイトのファイル・コンテンツの差分を継続監視し、勝手な書き換えをすぐ検知できるようにします。'
      },
      {
        head: 'CDN / WAF / SRI で配信経路を守る:',
        body: 'CDN や WAF(攻撃を弾く番人)を前段に置き、外部 JS には SRI(改ざん検知)を付けます。'
      }
    ],
    devNote: [
      {
        head: 'CMSの脆弱性管理を運用に組み込む:',
        body: 'WordPress などの CMS とプラグインは改ざんされやすい筆頭です。継続的な更新を運用ルーチンに組み込みましょう。'
      },
      {
        head: '本番ファイルの整合性監視(FIM):',
        body: '本番サーバの公開ディレクトリに、想定外のファイル変更があったらすぐアラートを出す仕組み(File Integrity Monitoring)を入れます。'
      },
      {
        head: '管理画面はIP制限+多要素認証で:',
        body: '管理画面を全世界に公開しない。社内IPだけに絞り、ログインには多要素認証を必須に。共有パスワードは禁止。'
      },
      {
        head: '広告・タグ・外部スクリプトに注意:',
        body: '埋め込みJSは改ざんの侵入口です。SRI(改ざん検知)/ CSP(読み込み元制限) / iframe sandbox を必ず使います。'
      },
      {
        head: 'ログを外部に即送出:',
        body: 'サーバ侵害でログを消されないよう、操作ログを SaaS など外部サービスへリアルタイム送出する作りに。'
      }
    ],
    steps: [
      {
        title: '攻撃者が「狙う人がよく見るサイト」を改ざん',
        description:
          '対象組織の従業員が頻繁に開く業界専門サイトを、攻撃者がこっそり書き換えて罠を仕掛けます。'
      },
      {
        title: 'いろいろな人が普段通りにそのサイトを開く',
        description:
          '対象組織の従業員も、無関係な人も、いつも通りそのサイトを開きます。'
      },
      {
        title: 'IPアドレスで対象組織の人だけ選んでウイルス配布',
        description:
          '改ざんされたページのプログラムが、訪問者のIPアドレスや使っているブラウザを見て、「狙った組織の人」だけに絞ってウイルスを配ります。'
      },
      {
        title: '対象組織だけが感染して気付かれにくい',
        description:
          '無関係な人には何も起きないので、被害が広まらず検知も遅れます。「いつものサイトを開いただけで感染」という、最も警戒されにくい侵入経路です。ブラウザ最新化 + EDR + DNSフィルタで防ぎます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      site: '改ざんされた業界サイト',
      emp1: '対象組織A の従業員',
      emp2: '対象組織B の従業員',
      outsider: '無関係な利用者',
      payload: 'ウイルス本体'
    },
    groupLabels: {
      targets: '狙われた組織',
      'attacker-infra': '攻撃者の道具置き場'
    }
  }
};
