import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'session-hijacking')!;

export const sessionHijacking: AttackDefinition = {
  meta,
  appliesIf: [
    { head: 'Cookie/トークンによるセッション管理を実装している:', body: 'Cookie認証を使う全アプリが対象(=ほぼすべての Web サービス)。' },
    { head: 'HTTPページが残っている:', body: '一部のページが平文HTTP/Mixed Contentならセッション盗聴の余地が残る。HSTS未適用も含む。' },
    { head: 'HttpOnly/Secure/SameSite未設定のCookie:', body: '属性を1つでも欠くと攻撃面が広がる。' },
    { head: 'ログイン後にセッションIDを再発行していない:', body: 'セッションフィクセーションの原因。' },
    { head: 'URLにセッションIDを乗せている:', body: 'JSESSIONID等の URL Rewrite は Referer / ログ / 共有経由で漏洩する。' }
  ],
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
    stage.addGroup({ id: 'legit', x: 0.02, y: 0.04, w: 0.50, h: 0.40, label: '正規利用者', variant: 'victim' });
    stage.addGroup({ id: 'attacker-side', x: 0.02, y: 0.60, w: 0.30, h: 0.36, label: '攻撃者', variant: 'attack' });
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.30 }, label: '正規利用者' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.78 }, label: '攻撃者' });
    stage.addActor('sid',      { pict: 'key',      pos: { x: 0.40, y: 0.50 }, label: 'セッションID' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.78, y: 0.50 }, label: 'Webサービス' });
    stage.addConnection('victim', 'sid', { id: 'hold', variant: 'flow' });
    stage.addConnection('sid', 'app', { id: 'auth', variant: 'flow' });
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
  ],
  beginner: {
    summary:
      'ログインの目印となる「セッションID」を盗まれて、本人のフリでサービスを使われてしまう攻撃。',
    appliesIf: [
      { head: 'ログイン機能がある:', body: '一度ログインしたあとも本人だと認識される作りなら、すべて対象です。' },
      { head: 'HTTPS化されていないページが残っている:', body: '一部だけ平文HTTPだと、そこで通信を覗かれてログイン目印を盗まれます。' },
      { head: 'クッキーに `HttpOnly` `Secure` `SameSite` を付けていない:', body: 'これらの設定が欠けるたびに攻撃の余地が広がります。' },
      { head: 'ログイン後にセッションIDを作り直していない:', body: '攻撃者が事前に用意した目印を使わせる手口を防げません。' },
      { head: 'URLに `?sid=...` のような形で目印が入る:', body: 'URLは履歴やログから漏れやすいので、目印をURLに乗せるのはNGです。' }
    ],
    caseStudy:
      '昔、公衆Wi-FiでHTTPS化されていないサイトの「ログイン目印(セッションCookie)」を盗み見て他人のSNSを乗っ取る Firesheep という事件がありました。他にも、URLにログイン目印が含まれている実装で、ブラウザがリンク元として送ってしまう情報からIDが漏れた事例や、画面に勝手なプログラムを仕込まれて目印を抜かれた事例が長年続いています。',
    damage: [
      {
        head: '本人のフリで全機能を使われる:',
        body: 'ログイン状態を奪われ、本人として投稿・買い物・設定変更などをやり放題されます。'
      },
      {
        head: '個人情報を見られる/書き換えられる:',
        body: '住所・連絡先・支払先などを覗かれたり書き換えられたりします。'
      },
      {
        head: '管理者を奪われると組織全体が危険:',
        body: '管理者のログイン目印を奪われると、利用者全員のアカウントを操作されかねません。'
      }
    ],
    defense: [
      {
        head: '通信をすべて暗号化(HTTPS化)+ 強制設定(HSTS):',
        body: '通信路で目印を盗み見られないように、サイトを完全 HTTPS 化して、HSTS という設定で「以後はずっと暗号化通信のみ」とブラウザに約束させます。'
      },
      {
        head: 'クッキーに守りの設定をつける:',
        body: 'ログイン目印のクッキーに `HttpOnly`(JSから読めない)、`Secure`(暗号化通信でしか送らない)、`SameSite=Lax以上`(他サイト経由では送らない)を必ず付けます。'
      },
      {
        head: 'ログインのタイミングで目印を作り直す:',
        body: 'ログイン成功時や権限変更時にセッションID(ログイン目印)を必ず再発行します。攻撃者があらかじめ用意した目印を使わせる手口を防げます。'
      },
      {
        head: '使う場所が急に変わったら再認証:',
        body: 'IPアドレスや使っているブラウザ情報が極端に変わったら、もう一度ログインさせるなどの再認証を求めます。'
      },
      {
        head: '長時間放置したら自動ログアウト:',
        body: '一定時間操作がなかったら自動でログアウト。長時間有効な目印を狙われないようにします。'
      }
    ],
    devNote: [
      {
        head: 'URLにセッションIDを載せない:',
        body: 'URL に `?sid=ABCDEF` のように目印を入れる作りは絶対NG。ブラウザの履歴・ログ・友達への共有など、複数のルートから漏れます。'
      },
      {
        head: 'XSS対策とセットで考える:',
        body: '画面で勝手なプログラムを動かされる弱点(XSS)が残っていると、どんなにクッキーを守っても抜かれます。XSS対策と一体です。'
      },
      {
        head: 'ログにIDを残さない:',
        body: 'Webサーバ・CDN・監視ツール(APM)のログにセッションIDが記録されていないか確認しましょう。'
      },
      {
        head: 'セッションフィクセーションに注意:',
        body: '攻撃者が事前に発行したIDを被害者に使わせる手口があります。ログイン時にIDを必ず再発行することで防げます。'
      },
      {
        head: '同時ログインの異常検知:',
        body: '同じアカウントで急に複数の地点から同時ログインがあったら、検知して通知できる仕組みを用意しておきます。'
      }
    ],
    steps: [
      {
        title: '正規利用者がログインして「目印」をもらう',
        description:
          'サービスにログインすると、サーバから「あなた本人ですよ」と認識するための目印(セッションID)が払い出されます。'
      },
      {
        title: '攻撃者がその目印を盗み出す',
        description:
          '公衆Wi-Fiでの盗み見、画面に仕込まれたプログラムによる持ち出し、URLログから漏れる、などの方法で、攻撃者が目印をコピーします。'
      },
      {
        title: '攻撃者が盗んだ目印を付けてアクセス',
        description:
          '攻撃者は盗んだ目印を自分のリクエストに付けるだけで、サーバから「本人」と認識されてしまいます。'
      },
      {
        title: 'なりすまされてしまった',
        description:
          'サーバは目印さえあれば本人と判断するので、攻撃者が好きなように操作できてしまいます。HTTPS + クッキーの守り設定 + ログイン時の目印再発行で防げます。'
      }
    ],
    actorLabels: {
      victim: '正規利用者',
      attacker: '攻撃者',
      sid: 'ログインの目印(セッションID)',
      app: 'Webサービス'
    },
    groupLabels: {
      legit: '正規利用者の世界',
      'attacker-side': '攻撃者の手元'
    },
    connectionLabels: {
      hold: '目印を保持',
      auth: '目印で本人として認識'
    }
  }
};
