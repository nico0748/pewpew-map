import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'session-hijacking')!;

export const sessionHijacking: AttackDefinition = {
  meta,
  caseStudy:
    '公衆Wi-FiでHTTPS未対応サイトのセッションCookieを盗聴(Firesheep事件)、URLにセッションIDを含む実装からRefererヘッダ経由で漏洩、XSSによるdocument.cookie送信など、セッションIDの取り扱いミスによる事案が長年発生している。',
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
    { head: 'ログ/分析にCookieを残さない:', body: 'Webサーバ/CDN/APMのログがセッションIDを保存していないか確認。' },
    { head: 'セッションフィクセーション:', body: '攻撃者が事前に発行したIDを被害者に使わせる手口。ログイン時の再生成で防ぐ。' },
    { head: '同時セッション制御:', body: '不審な多重セッションを検知/通知する仕組みを用意。' }
  ],
  setup(stage) {
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.30 }, label: '正規利用者' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.78 }, label: '攻撃者' });
    stage.addActor('sid',      { pict: 'key',      pos: { x: 0.40, y: 0.50 }, label: 'セッションID' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.78, y: 0.50 }, label: 'Webサービス' });
  },
  steps: [
    {
      title: '正規利用者がログインし、セッションIDが発行される',
      description: 'サーバが利用者にセッションIDを払い出す。これがあれば本人として扱われる。',
      run: (stage) => {
        stage.sendPacket('app', 'sid', { duration: 1000, className: 'benign', payload: 'Set-Cookie: SID=…' });
      }
    },
    {
      title: '攻撃者がセッションIDを盗み出す',
      description: '公衆Wi-Fi盗聴、XSSによる document.cookie 送信、URL ログ流出などの経路で奪取される。',
      run: (stage) => {
        stage.sendPacket('sid', 'attacker', { duration: 1100, payload: 'SID=ABCDEF...' });
      }
    },
    {
      title: '攻撃者が同じCookieでアクセス',
      description: '攻撃者は盗んだセッションIDを自分のリクエストに付けるだけで、認証を通過してしまう。',
      run: (stage) => {
        stage.sendPacket('attacker', 'app', { duration: 1100, payload: 'Cookie: SID=ABCDEF...' });
      }
    },
    {
      title: 'なりすまし成立',
      description: 'サーバはセッションIDだけで本人と判断するため、本人としての操作が可能になる。HTTPS + HttpOnly/Secure/SameSite + ログイン時ID再生成 で防御可能。',
      run: (stage) => {
        stage.flashActor('app', 'shake', 800);
      }
    }
  ]
};
