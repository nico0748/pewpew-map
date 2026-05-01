import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'drive-by-download')!;

export const driveByDownload: AttackDefinition = {
  meta,
  caseStudy:
    '改ざんされた正規サイトや汚染された広告(Malvertising)を経由して、利用者がページを閲覧するだけで脆弱なブラウザ/プラグインを突かれマルウェアが自動ダウンロード・実行される事案が継続発生。Flash/IE時代に多発したが、今もブラウザのゼロデイを突く形態で続いている。',
  damage: [
    { head: 'マルウェア感染:', body: 'バンキング型・スパイ型・ランサムウェア等が無自覚にインストールされる。' },
    { head: '情報窃取:', body: '保存パスワード・Cookie・暗号通貨ウォレットを抜かれる。' },
    { head: '踏み台化:', body: 'ボットネット参加・社内ネットワークへの侵入起点にされる。' },
    { head: '広告経由の連鎖:', body: '正規サイト + 汚染広告で被害が広範囲に及ぶ(Malvertising)。' }
  ],
  defense: [
    { head: 'ブラウザ/OSの最新化:', body: '自動更新を有効化し、ゼロデイ修正を即時適用。' },
    { head: 'EDR/AV:', body: 'シグネチャ + 振る舞い検知でドロッパ実行を遮断。' },
    { head: '広告ブロック / DNSフィルタ:', body: '不審ドメインへの接続自体を遮断。' },
    { head: 'SmartScreen / Safe Browsing:', body: 'ブラウザの保護機能を有効化。' },
    { head: '権限分離:', body: 'ユーザ権限で実行されるため、管理者権限での日常運用を避ける。' }
  ],
  devNote: [
    { head: 'Subresource Integrity (SRI):', body: '外部CDNのJSをそのまま読み込まない。改ざん検知のためSRIを付与。' },
    { head: 'CSPで読み込み元を制限:', body: 'script-src/img-src を狭く絞り、第三者改ざん広告の影響を限定。' },
    { head: '広告タグ管理:', body: 'タグマネージャ/広告SDKは導入元の信頼性を継続評価。' },
    { head: 'iframe sandbox:', body: '埋め込み外部コンテンツは sandbox 属性で権限を最小化。' },
    { head: 'インシデント時の連絡経路:', body: '改ざん検知時のCDNパージ・告知手順をRunbook化しておく。' }
  ],
  setup(stage) {
    stage.addGroup({ x: 0.50, y: 0.04, w: 0.46, h: 0.92, label: '攻撃者インフラ', variant: 'attack' });
    stage.addActor('victim',  { pict: 'user',     pos: { x: 0.10, y: 0.5  }, label: '利用者' });
    stage.addActor('site',    { pict: 'browser',  pos: { x: 0.36, y: 0.5  }, label: '改ざんサイト' });
    stage.addActor('exploit', { pict: 'warning',  pos: { x: 0.62, y: 0.5  }, label: 'Exploit Kit' });
    stage.addActor('payload', { pict: 'document', pos: { x: 0.85, y: 0.22 }, label: 'マルウェア' });
    stage.addActor('cnc',     { pict: 'attacker', pos: { x: 0.85, y: 0.78 }, label: '攻撃者C&C' });
    stage.addConnection('site', 'exploit', { variant: 'attack', dashed: true, label: 'redirect' });
    stage.addConnection('exploit', 'payload', { variant: 'attack', dashed: true });
  },
  steps: [
    {
      title: '普段のサイトを閲覧',
      description: '利用者は普段通りに正規サイトを訪問するが、サイトはこっそり改ざんされている。',
      run: (stage) => {
        stage.sendPacket('victim', 'site', { duration: 1000, className: 'benign', payload: 'GET /' });
      }
    },
    {
      title: 'Exploit Kit へ自動リダイレクト',
      description: '埋め込まれた攻撃用JSが、ブラウザを攻撃者の Exploit Kit へリダイレクトさせる。',
      run: (stage) => {
        stage.sendPacket('site', 'exploit', { duration: 1000, payload: 'iframe → exploit kit' });
      }
    },
    {
      title: 'ゼロデイを突きペイロード送り込み',
      description: 'ブラウザ/プラグインの脆弱性を突き、マルウェア(dropper)を被害端末へ送り込む。',
      run: (stage) => {
        stage.flashActor('exploit', 'shake', 800);
        stage.sendPacket('exploit', 'payload', { duration: 900, payload: 'dropper.exe' });
        stage.after(900, () => stage.sendPacket('payload', 'victim', { duration: 1000, payload: '自動DL+実行' }));
      }
    },
    {
      title: '感染端末がC&Cとビーコン',
      description: '感染が成立した端末はバックグラウンドでC&Cと通信を始め、追加の指示や情報送信を行う。',
      run: (stage) => {
        stage.flashActor('victim', 'shake', 1000);
        stage.sendPacket('victim', 'cnc', { duration: 1100, payload: 'beacon' });
      }
    }
  ]
};
