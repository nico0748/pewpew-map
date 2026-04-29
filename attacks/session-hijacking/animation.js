import { Stage, sequence } from '../../assets/js/animator.js';
import { renderAttackPage } from '../../assets/js/page.js';

const stage = new Stage('#stage');
stage.addActor('victim',   'user',     { x: 0.10, y: 0.30 }, '正規利用者');
stage.addActor('attacker', 'attacker', { x: 0.10, y: 0.78 }, '攻撃者');
stage.addActor('sid',      'key',      { x: 0.40, y: 0.50 }, 'セッションID');
stage.addActor('app',      'server',   { x: 0.78, y: 0.50 }, 'Webサービス');

renderAttackPage({
  title: 'セッションハイジャック',
  titleEn: 'Session Hijacking',
  caseStudy: '公衆Wi-FiでHTTPS未対応サイトのセッションCookieを盗聴(Firesheep事件)、URLにセッションIDを含む実装からRefererヘッダ経由で漏洩、XSSによるdocument.cookie送信など、セッションIDの取り扱いミスによる事案が長年発生している。',
  damage: [
    { head: 'なりすまし操作:', body: 'ログイン状態を奪われ、本人として全機能を利用される。' },
    { head: '個人情報閲覧/書換:', body: '住所/連絡先/支払先などを操作される。' },
    { head: '権限昇格:', body: '管理者セッションを奪われると組織全体に被害が拡大。' }
  ],
  defense: [
    { head: 'HTTPS全面化 + HSTS:', body: '通信路でのセッションID盗聴を防ぐ。' },
    { head: 'Cookie属性設定:', body: 'HttpOnly + Secure + SameSite=Lax以上 を必須に。' },
    { head: 'ログイン後にID再生成:', body: '認証成功後/権限変更後はセッションIDを必ず再発行。' },
    { head: 'IP/UAバインディング:', body: '極端な変化があれば再認証要求。' },
    { head: '短い有効期限 + アイドルタイムアウト:', body: '長時間放置のセッションは自動失効。' }
  ],
  devNote: [
    { head: 'URLにセッションIDを載せない:', body: 'JSESSIONID等のURL Rewriteは Referer / ログ / 共有経由で漏洩する。' },
    { head: 'XSS対策と一体で考える:', body: 'XSSを許すとどんなID保護も無意味。両方必要。' },
    { head: 'ログ/分析にCookieを残さない:', body: 'Webサーバ/CDN/APMのリクエストログがセッションIDを保存していないか確認。' },
    { head: 'セッションフィクセーション:', body: '攻撃者が事前に発行したIDを被害者に使わせる手口。ログイン時の再生成で防ぐ。' },
    { head: '同時セッション制御:', body: '不審な多重セッションを検知/通知する仕組みを用意。' }
  ]
});

document.getElementById('play').addEventListener('click', play);
document.getElementById('reset').addEventListener('click', () => { stage.reset(); stage.status('準備完了'); });

function play() {
  stage.reset();
  stage.status('攻撃シナリオ再生中…');

  sequence([
    { delay: 0, run: () => {
      stage.status('正規利用者がログイン → セッションIDが発行される');
      stage.sendPacket('app', 'sid', { duration: 600, className: 'benign', payload: 'Set-Cookie: SID=…' });
    }, hold: 800 },
    { delay: 0, run: () => {
      stage.status('Wi-Fi盗聴 / XSSなどで攻撃者がIDを取得');
      stage.sendPacket('sid', 'attacker', { duration: 800, payload: 'SID=ABCDEF...' });
    }, hold: 1000 },
    { delay: 0, run: () => {
      stage.status('攻撃者が同じCookieでアクセス → 認証通過');
      stage.sendPacket('attacker', 'app', { duration: 900, payload: 'Cookie: SID=ABCDEF...' });
    }, hold: 1000 },
    { delay: 0, run: () => {
      stage.flashActor('app', 'shake', 500);
      stage.status('サーバはセッションIDだけで本人として扱う');
    }, hold: 800 },
    { delay: 0, run: () => {
      stage.status('攻撃完了: HTTPS + HttpOnly/Secure/SameSite + ログイン時ID再生成 で防御');
    }, hold: 0 }
  ]);
}
