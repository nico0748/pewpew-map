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
  ]
};
