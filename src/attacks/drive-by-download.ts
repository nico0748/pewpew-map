import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
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
    stage.addActor('victim',  { pict: 'user',     pos: { x: 0.10, y: 0.5  }, label: '利用者' });
    stage.addActor('site',    { pict: 'browser',  pos: { x: 0.36, y: 0.5  }, label: '改ざんサイト' });
    stage.addActor('exploit', { pict: 'warning',  pos: { x: 0.62, y: 0.5  }, label: 'Exploit Kit' });
    stage.addActor('payload', { pict: 'document', pos: { x: 0.85, y: 0.22 }, label: 'マルウェア' });
    stage.addActor('cnc',     { pict: 'attacker', pos: { x: 0.85, y: 0.78 }, label: '攻撃者C&C' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('利用者が普段のサイトを閲覧(改ざんに気づかない)');
          stage.sendPacket('victim', 'site', { duration: 700, className: 'benign', payload: 'GET /' });
        }, hold: 800 },
        { run: () => {
          stage.status('ページ内のスクリプトが Exploit Kit へ自動リダイレクト');
          stage.sendPacket('site', 'exploit', { duration: 700, payload: 'iframe → exploit kit' });
        }, hold: 900 },
        { run: () => {
          stage.flashActor('exploit', 'shake', 600);
          stage.status('ブラウザ/プラグインのゼロデイを突き、マルウェアを配信');
          stage.sendPacket('exploit', 'payload', { duration: 700, payload: 'dropper.exe' });
        }, hold: 900 },
        { run: () => {
          stage.sendPacket('payload', 'victim', { duration: 900, payload: '自動DL+実行' });
          stage.flashActor('victim', 'shake', 800);
        }, hold: 1000 },
        { run: () => {
          stage.status('感染端末がC&Cと通信開始');
          stage.sendPacket('victim', 'cnc', { duration: 1000, payload: 'beacon' });
        }, hold: 1100 },
        { run: () => stage.status('攻撃完了: ブラウザ最新化 + EDR + CSP/SRI/sandbox で多層防御') }
      ]);
    };
  }
};
