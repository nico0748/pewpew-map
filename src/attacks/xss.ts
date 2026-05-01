import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'xss')!;

export const xss: AttackDefinition = {
  meta,
  caseStudy:
    '大手ECサイトのレビュー欄に <script> が投稿可能になっており、閲覧者のセッションCookieが攻撃者サーバへ送信され、なりすましログインに悪用された事例が多数報告されている。',
  damage: [
    { head: 'セッションCookie窃取:', body: 'document.cookieを送信され、なりすましログインされる。' },
    { head: '個人情報入力の盗聴:', body: 'フォーム入力値をキー入力単位で外部送信される。' },
    { head: '画面改ざん:', body: 'フィッシングフォームを差し込まれ、利用者を誤誘導される。' },
    { head: 'マルウェア配布:', body: '正規サイト閲覧から不正サイトへ自動遷移させられる。' }
  ],
  defense: [
    { head: '出力時エスケープ:', body: 'HTML/属性/JS/URLの文脈ごとに正しくエスケープ。テンプレートの自動エスケープを有効化。' },
    { head: 'CSP設定:', body: 'Content-Security-Policyで script-src を制限し、インライン実行を抑止。' },
    { head: 'HttpOnly Cookie:', body: 'セッションCookieはJSから読めなくする。Secure/SameSiteも併用。' },
    { head: '入力検証:', body: 'ホワイトリスト方式で許容文字を限定。' },
    { head: 'リッチテキスト用サニタイザ:', body: 'DOMPurify等の実績あるライブラリを使う。' }
  ],
  devNote: [
    { head: '"安全なAPIだけ使う":', body: 'innerHTML/dangerouslySetInnerHTML/v-html を避け、textContentや{{ }}を使う。' },
    { head: 'href/src属性の検証:', body: 'javascript: スキームや data: URLを許可しない。' },
    { head: 'JSONをHTMLに埋め込む際:', body: '/<\\/script>/ や < > を必ずエスケープ。' },
    { head: 'CSP nonce/hash:', body: 'インラインscriptが必要な場合はnonce/hashで限定。' },
    { head: 'WAFは万能ではない:', body: '出力エスケープ等の根本対策と組み合わせる。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'victim-side', x: 0.02, y: 0.62, w: 0.62, h: 0.34, label: '被害者側', variant: 'victim' });
    stage.addGroup({ id: 'attacker-infra', x: 0.74, y: 0.30, w: 0.24, h: 0.40, label: '攻撃者インフラ', variant: 'attack' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.25 }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.50, y: 0.25 }, label: '掲示板/SNS' });
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.78 }, label: '一般利用者' });
    stage.addActor('browser',  { pict: 'browser',  pos: { x: 0.50, y: 0.78 }, label: '被害ブラウザ' });
    stage.addActor('cnc',      { pict: 'bot',      pos: { x: 0.88, y: 0.5 },  label: '攻撃者の収集サーバ' });
    stage.addConnection('victim', 'browser', { id: 'use', variant: 'flow' });
    stage.addConnection('browser', 'app', { id: 'view', variant: 'flow', dashed: true });
  },
  steps: [
    {
      title: '悪意あるスクリプトを投稿',
      description: '攻撃者が掲示板や SNS の投稿欄に <script> を含むデータを保存する(蓄積型XSS)。',
      run: (stage) => {
        stage.sendPacket('attacker', 'app', { duration: 1000, payload: '<script>fetch(...)</script>' });
      }
    },
    {
      title: '一般利用者がページを閲覧',
      description: '何も知らない利用者が攻撃者の投稿が含まれるページを開く。',
      run: (stage) => {
        stage.sendPacket('victim', 'browser', { duration: 900, className: 'benign', payload: 'GET /board' });
        stage.after(900, () => {
          stage.sendPacket('browser', 'app', { duration: 700, className: 'benign', payload: 'fetch HTML' });
        });
      }
    },
    {
      title: 'エスケープされていないHTMLが返却',
      description: 'アプリが投稿内容をエスケープせずそのまま埋め込んで返却する。',
      run: (stage) => {
        stage.sendPacket('app', 'browser', { duration: 1000, payload: '...<script>...' });
      }
    },
    {
      title: 'ブラウザでスクリプトが実行 → Cookie送信',
      description: '被害者のブラウザが攻撃者のスクリプトを実行し、セッションCookieが攻撃者サーバへ送信される。',
      run: (stage) => {
        stage.flashActor('browser', 'shake', 800);
        stage.sendPacket('browser', 'cnc', { duration: 1300, payload: 'document.cookie' });
      }
    },
    {
      title: 'なりすまし成立',
      description: '攻撃者は入手したCookieで被害者になりすましログインできる。出力エスケープ + CSP + HttpOnly で防御可能。',
      run: (stage) => {
        stage.flashActor('cnc', 'shake', 800);
      }
    }
  ],
  beginner: {
    summary:
      '掲示板やSNSの投稿欄に「ページを開いた人のブラウザで勝手に動くプログラム」を埋め込まれて、ログイン情報を盗まれてしまう攻撃。',
    caseStudy:
      '大手通販サイトのレビュー欄に、攻撃用のプログラム文字列を投稿できる弱点があり、ページを見ただけの利用者から「ログインしっぱなし状態を保つための目印(クッキー)」が攻撃者のサーバに送られて、なりすましでログインされてしまった事例が多数報告されています。',
    damage: [
      {
        head: 'ログイン情報(クッキー)を盗まれる:',
        body: 'ブラウザに保存されている「ログイン状態を保つための目印(クッキー)」を勝手に外部へ送られて、本人としてログインされてしまいます。'
      },
      {
        head: '入力中の文字を盗み見られる:',
        body: '住所やクレジットカード番号など、フォームに打ち込んでいる内容を1文字単位で攻撃者に送られます。'
      },
      {
        head: '画面を書き換えられる:',
        body: '本物の画面に偽のログインフォームを差し込まれ、利用者が知らずに偽サイトに情報を入力してしまいます。'
      },
      {
        head: 'ウイルス配布の踏み台にされる:',
        body: '正規のページから自動で攻撃用サイトへ飛ばされ、ウイルスを仕込まれます。'
      }
    ],
    defense: [
      {
        head: '画面に出すときに記号を「ただの文字」に変える(エスケープ):',
        body: 'ユーザの入力をそのまま画面に貼り付けず、`<` `>` `"` などをただの文字として表示する処理(エスケープ)を必ずかけます。テンプレートライブラリの自動エスケープ機能をオフにしないこと。'
      },
      {
        head: '勝手なプログラム実行を禁じる宣言(CSP)を入れる:',
        body: 'ブラウザに対して「この場所のスクリプトしか動かしてよくない」と宣言する HTTP ヘッダ(CSP)を設定します。万一プログラムが埋め込まれても実行を止められます。'
      },
      {
        head: 'クッキーをJavaScriptから読めなくする(HttpOnly):',
        body: 'ログイン用クッキーには HttpOnly という設定を付けて、ブラウザ上のプログラムから読めないようにします。Secure / SameSite も合わせて付けます。'
      },
      {
        head: '入力できる文字を絞る:',
        body: '入力欄に書いてよい文字種(英数字のみなど)を決めて、それ以外は弾きます。'
      },
      {
        head: 'リッチ入力には実績ある掃除ライブラリ:',
        body: 'ブログのように太字や画像を許可したい場合は、自前で済ませず DOMPurify などの「危険な部分だけ取り除いてくれるライブラリ」を使います。'
      }
    ],
    devNote: [
      {
        head: '危険な書き込み方を避ける:',
        body: '`innerHTML` / React の `dangerouslySetInnerHTML` / Vue の `v-html` のような「HTMLをそのまま流し込む書き方」は基本使わない。`textContent` や `{{ }}` を使えば自動でエスケープされます。'
      },
      {
        head: 'リンク先のチェック:',
        body: 'ユーザが入力した URL をリンク (`<a href>`) や画像 (`<img src>`) に出すときは、`javascript:` で始まるものや `data:` URL を弾きます。'
      },
      {
        head: 'JSONをHTMLに埋めるとき:',
        body: 'スクリプトタグの中に JSON を入れる場合、`</script>` という文字列が入っていると壊れるので必ず `<` `>` をエスケープ。'
      },
      {
        head: 'インラインで動かしたいときは nonce / hash:',
        body: 'CSP を設定したうえで、どうしても直書きのスクリプトを動かしたい場合は、サーバ側で発行した使い捨てトークン(nonce)やハッシュで限定します。'
      },
      {
        head: 'WAF(攻撃を弾く番人)だけに頼らない:',
        body: 'WAF(怪しいリクエストを自動で弾くソフト)は補助です。出力時のエスケープなど根本対策と必ず組み合わせます。'
      }
    ],
    steps: [
      {
        title: '攻撃者が「画面で勝手に動くプログラム」を投稿する',
        description:
          '攻撃者が掲示板や SNS の投稿欄に、`<script>...</script>` のような「ページを開いた人のブラウザで動くプログラム」を仕込んで保存します(蓄積型XSSと呼ばれる手口)。'
      },
      {
        title: '何も知らない利用者がページを開く',
        description:
          '事情を知らない一般利用者が、攻撃者の投稿を含むページを表示します。'
      },
      {
        title: 'サーバが投稿をそのまま貼り付けて返してしまう',
        description:
          'アプリが投稿内容を「ただの文字」に変える処理(エスケープ)をせず、HTML としてそのまま返してしまいます。'
      },
      {
        title: 'ブラウザがプログラムを実行してクッキーを送ってしまう',
        description:
          '利用者のブラウザが攻撃者のプログラムを実行し、ログイン状態を保つ目印(クッキー)が攻撃者のサーバに送られます。'
      },
      {
        title: 'なりすましでログインされる',
        description:
          '攻撃者は手に入れたクッキーを使って、本人のフリでログインできてしまいます。エスケープ + CSP + HttpOnly クッキーの 3 点を組み合わせれば防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      app: '掲示板やSNSのアプリ',
      victim: '一般の利用者',
      browser: '利用者のブラウザ',
      cnc: '攻撃者のデータ集めサーバ'
    },
    groupLabels: {
      'victim-side': '利用者の手元',
      'attacker-infra': '攻撃者の道具'
    },
    connectionLabels: {
      use: 'ブラウザを使う',
      view: 'ページを見にいく'
    }
  }
};
