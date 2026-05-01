import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'clickjacking')!;

export const clickjacking: AttackDefinition = {
  meta,
  caseStudy:
    '"いいね/シェア" や "退会" ボタンを透明iframeで重ね、利用者に別のボタンを押させたつもりにさせて操作させる手口。Adobe Flash の権限ダイアログを重ねてカメラ/マイクを許可させる事例(2008年公表)が古典。',
  damage: [
    { head: '意図しない操作:', body: 'シェア/フォロー/購入/退会 などを"うっかり"実行させられる。' },
    { head: 'プライバシー設定変更:', body: 'SNSの公開範囲設定をこっそり変更される。' },
    { head: 'デバイス権限許可:', body: 'カメラ/マイク/通知 等のブラウザ権限を承認させられる。' }
  ],
  defense: [
    { head: 'X-Frame-Options:', body: 'DENY または SAMEORIGIN を設定し、外部からの埋め込みを禁止。' },
    { head: 'CSP frame-ancestors:', body: 'X-Frame-Optionsの後継。許可するOriginを明示できる。' },
    { head: '重要操作には再認証:', body: 'パスワード入力やCAPTCHAでクリック操作だけでは突破できなくする。' },
    { head: 'JSによるフレームバスティング:', body: 'top !== self の場合に画面を隠すなど(古典手法、補助的)。' }
  ],
  devNote: [
    { head: '"埋め込まれない" を初期値に:', body: '埋め込み許可が必要なページに限ってホワイトリスト指定する設計が安全。' },
    { head: 'CDN/リバプロのデフォルト:', body: '上流でX-Frame-Optionsを上書きしている場合があるので、本番ヘッダを実機検証する。' },
    { head: 'OAuth/同意画面:', body: '同意画面のクリックジャック対策はOAuthプロバイダ側の責務。重ねられない設計を選ぶ。' },
    { head: 'モバイルWebView:', body: 'タッチ位置擬装(Tapjacking)もあり、Androidの FLAG_NOT_TOUCHABLE などの併用を検討。' },
    { head: '監視:', body: 'Refererに見覚えのないドメインから大量トラフィックがあれば、埋め込み試行を疑う。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'trap-page', x: 0.28, y: 0.10, w: 0.30, h: 0.80, label: '罠ページ(2層構造)', variant: 'attack' });
    stage.addActor('victim', { pict: 'user',    pos: { x: 0.10, y: 0.5  }, label: '利用者' });
    stage.addActor('trap',   { pict: 'browser', pos: { x: 0.40, y: 0.30 }, label: '罠ページ(表)' });
    stage.addActor('hidden', { pict: 'browser', pos: { x: 0.40, y: 0.70 }, label: '正規ページ(透明iframe)' });
    stage.addActor('app',    { pict: 'server',  pos: { x: 0.85, y: 0.5  }, label: '正規サービス' });
    stage.addConnection('trap', 'hidden', { id: 'overlay', variant: 'aux', dashed: true, label: '重ね合わせ' });
    stage.addConnection('hidden', 'app', { id: 'request', variant: 'flow', dashed: true });
  },
  steps: [
    {
      title: '罠ページを開く',
      description: '"プレゼント当選!" などのキャッチで利用者を罠ページに誘導する。',
      run: (stage) => {
        stage.sendPacket('victim', 'trap', { duration: 1000, className: 'benign', payload: 'クリック誘導' });
      }
    },
    {
      title: '裏側に正規ページが透明で重なっている',
      description: '罠ページの裏に正規サービスの操作画面が透明iframeで重ねられている。',
      run: (stage) => {
        stage.flashActor('hidden', 'shake', 1000);
      }
    },
    {
      title: 'クリックが正規ページの操作を踏む',
      description: '"応募する"を押したつもりが、裏の透明iframe上の "送金/退会" ボタンをクリックしてしまう。',
      run: (stage) => {
        stage.sendPacket('trap', 'hidden', { duration: 800, payload: 'クリック透過' });
      }
    },
    {
      title: '正規サービスで操作が確定',
      description: 'Cookieが付いているため、本人の操作として処理が成立する。X-Frame-Options/CSP frame-ancestors で埋め込み禁止が必須。',
      run: (stage) => {
        stage.sendPacket('hidden', 'app', { duration: 1100, payload: 'POST /transfer' });
        stage.after(900, () => stage.flashActor('app', 'shake', 700));
      }
    }
  ],
  beginner: {
    summary:
      '罠ページの上に「本物の操作画面」を透明にして重ねて、利用者がクリックしたつもりの裏で別のボタンを押させてしまう攻撃。',
    caseStudy:
      '昔から「いいね/シェア」「退会」「Flashのカメラ・マイク許可」などのボタンを、透明な層として罠ページの上に重ね、「プレゼント当選!」のキャッチに釣られてクリックすると、裏で別の操作が走る、という手口が繰り返されています。',
    damage: [
      {
        head: 'やった覚えのない操作:',
        body: 'シェア・フォロー・購入・退会などを「うっかり」押してしまったことになります。'
      },
      {
        head: 'プライバシー設定の改ざん:',
        body: 'SNSの公開範囲設定を、本人が気づかないうちに変えられてしまいます。'
      },
      {
        head: 'カメラ/マイクの権限を許可させられる:',
        body: 'ブラウザのカメラ/マイク/通知などの許可ダイアログを「OK」と押させられて、覗き見の道具にされます。'
      }
    ],
    defense: [
      {
        head: '自分のサイトを「他サイトの中に表示できない」ように宣言:',
        body: 'HTTP ヘッダの `X-Frame-Options: DENY` または `SAMEORIGIN` を返して、外部サイトの中に自分のページを埋め込ませないようにします。'
      },
      {
        head: '新しい設定 (CSP frame-ancestors) で許可元を絞る:',
        body: 'CSP の `frame-ancestors` ディレクティブで「埋め込んで良いサイト」をきっちり指定します。X-Frame-Options の後継で、より柔軟です。'
      },
      {
        head: '大事な操作はクリックだけで済ませない:',
        body: 'パスワード入力・CAPTCHA(画像認証)・ワンタイムコードなどを挟み、クリックだけでは突破できなくします。'
      },
      {
        head: '昔ながらのフレーム破り(frame-busting):',
        body: '`if (top !== self) { 画面を隠す }` のような JavaScript で「他サイトの中に埋め込まれていたら表示しない」ようにする手法。補助として有効。'
      }
    ],
    devNote: [
      {
        head: '「埋め込まれない」を初期値にする:',
        body: '基本は埋め込み禁止にして、本当に必要なページだけ許可する設計が安全です。'
      },
      {
        head: '本番のヘッダを実機で確認:',
        body: 'CDN や前段のリバースプロキシが上書きしている場合があります。本番環境のレスポンスヘッダを実機で確認しましょう。'
      },
      {
        head: 'OAuth同意画面の対策はプロバイダ任せ:',
        body: 'OAuth(他サービスとログイン連携する仕組み)の同意画面は、提供元(Google/GitHub等)が埋め込み防止を担います。埋め込み可能な提供元を選ばない。'
      },
      {
        head: 'モバイルアプリのWebViewにも注意:',
        body: 'AndroidなどではタップTapjackingという「タッチ位置を擬装する」似た攻撃があります。`FLAG_NOT_TOUCHABLE` などの併用を検討。'
      },
      {
        head: '監視:',
        body: '「見覚えのないドメインから自分のサイトに大量に来ている」というアクセスログのパターンは、埋め込みの試行を疑います。'
      }
    ],
    steps: [
      {
        title: '利用者が罠ページを開く',
        description:
          '「プレゼント当選!」「謎のスクラッチくじ」のような釣り文句で、利用者を罠ページに誘い込みます。'
      },
      {
        title: '裏側に正規ページが透明で重ねられている',
        description:
          '罠ページの裏に、「本物のサービスの操作画面」が透明な層として重ねられています(透明な iframe)。利用者には見えません。'
      },
      {
        title: 'クリックが透けて裏のボタンを押してしまう',
        description:
          '「応募する」を押したつもりが、その下にある透明な「送金する」「退会する」のボタンをクリックしてしまいます。'
      },
      {
        title: '本人の操作として記録されてしまう',
        description:
          'ログイン状態の目印(クッキー)が付いているので、本物のサービスから見ると「本人がやった操作」として確定します。X-Frame-Options や CSP の frame-ancestors を設定すれば防げます。'
      }
    ],
    actorLabels: {
      victim: '利用者',
      trap: '罠ページ(表面に出ている)',
      hidden: '本物のページ(透明にして重ねてある)',
      app: '本物のサービス'
    },
    groupLabels: {
      'trap-page': '罠ページ(2層構造)'
    },
    connectionLabels: {
      overlay: '透明にして重ねている',
      request: '本物に操作リクエスト'
    }
  }
};
