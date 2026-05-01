import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'csrf')!;

export const csrf: AttackDefinition = {
  meta,
  caseStudy:
    '2005年 mixi の "ぼくはまちちゃん!" 事件、2012年 遠隔操作ウイルス事件で掲示板に書き込ませた踏み台URLなど、ログイン中の利用者に意図しない投稿/設定変更を行わせる事案が国内外で多数発生している。',
  damage: [
    { head: '意図しない投稿/送金:', body: 'SNS書込・退会・パスワード変更・送金などを本人名義で実行されてしまう。' },
    { head: '管理画面の操作:', body: '管理者がログイン中に罠ページを開くと権限変更などを誘発される。' },
    { head: 'IoT機器の改ざん:', body: 'ローカルネットのルータ管理画面に対するCSRFで設定が書き換えられる事例も。' }
  ],
  defense: [
    { head: 'CSRFトークン:', body: 'フォーム/APIに使い捨てのトークンを必須化し、サーバ側で検証する。' },
    { head: 'SameSite Cookie:', body: 'セッションCookieに SameSite=Lax 以上を設定し、外部サイトからの送信を抑止。' },
    { head: 'Origin/Referer検証:', body: 'POSTやAPIで送信元を検証し、外部Originからのリクエストを拒否。' },
    { head: '重要操作には再認証:', body: 'パスワード変更・送金などはパスワード再入力やMFAを必須化。' }
  ],
  devNote: [
    { head: 'GETで状態変更しない:', body: 'リンク踏ませただけで何かが変わる作りはNG。状態変更はPOST/PUT/DELETEに統一。' },
    { head: 'CORSとCSRFは別物:', body: 'CORSが効くのはJSのfetch等。フォームsubmitは制限されないため別途対策が必要。' },
    { head: 'JSON APIも油断しない:', body: 'Content-Type: text/plain や multipart/form-data で送ると "シンプルリクエスト" 扱いで届くことがある。' },
    { head: 'フレームワーク機能を使う:', body: 'Rails/Laravel/Django/Spring等は標準でCSRF対策を持つ。"自前実装" を避ける。' },
    { head: 'モバイルAPIのトークン:', body: 'Cookie認証ではなくAuthorizationヘッダにすればCSRFリスクは大幅減。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'trap-domain', x: 0.02, y: 0.04, w: 0.50, h: 0.36, label: '罠ドメイン', variant: 'attack' });
    stage.addGroup({ id: 'victim-side', x: 0.02, y: 0.60, w: 0.50, h: 0.36, label: '被害者側', variant: 'victim' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.20 }, label: '攻撃者' });
    stage.addActor('trap',     { pict: 'browser',  pos: { x: 0.40, y: 0.20 }, label: '罠サイト' });
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.78 }, label: '被害者(ログイン中)' });
    stage.addActor('vbrowser', { pict: 'browser',  pos: { x: 0.40, y: 0.78 }, label: '被害者ブラウザ' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.85, y: 0.5  }, label: '正規サービス' });
    stage.addConnection('vbrowser', 'app', { id: 'logged-in', variant: 'flow', dashed: true, label: 'Cookie保持中' });
  },
  steps: [
    {
      title: '罠サイトを設置',
      description: '攻撃者が、隠しフォームや<img>に正規サイトへのリクエストを仕込んだ罠ページを公開する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'trap', { duration: 1000, payload: '<form action=正規 …>' });
      }
    },
    {
      title: '被害者が正規サービスにログイン中',
      description: '被害者は別タブで正規サービスにログインしていて、ブラウザはCookieを保持している。',
      run: (stage) => {
        stage.sendPacket('victim', 'vbrowser', { duration: 800, className: 'benign', payload: '正規ログイン済' });
      }
    },
    {
      title: '罠ページを閲覧してしまう',
      description: 'メールやSNSのリンクから罠ページを開いてしまう。',
      run: (stage) => {
        stage.sendPacket('vbrowser', 'trap', { duration: 1000, className: 'benign', payload: 'GET 罠ページ' });
      }
    },
    {
      title: '罠ページが正規サービスに自動POST',
      description: '罠ページのJSが正規サービスにリクエストを発行し、ブラウザはCookieを同送してしまう。',
      run: (stage) => {
        stage.sendPacket('vbrowser', 'app', { duration: 1300, payload: 'POST /transfer (+Cookie)' });
      }
    },
    {
      title: '正規サービスは本人操作と誤認',
      description: 'Cookieが付いているため、正規サービスは"本人の操作"として処理してしまう。CSRFトークン+SameSiteで防御可能。',
      run: (stage) => {
        stage.flashActor('app', 'shake', 1000);
      }
    }
  ],
  beginner: {
    summary:
      'ログイン中の人にこっそり罠ページを踏ませて、本人のフリで投稿・退会・送金などをさせてしまう攻撃。',
    caseStudy:
      '2005年にSNSで「ぼくはまちちゃん!」と勝手に書き込まれる悪戯が大流行しました。仕組みは「ログイン中の人が罠リンクを踏むと、本人のアカウントで自動投稿される」というもので、その後の遠隔操作ウイルス事件など、本人になりすました投稿・送金が今も繰り返し発生しています。',
    damage: [
      {
        head: '本人名義で勝手に操作される:',
        body: 'SNSへの書き込み・退会・パスワード変更・送金などが、本人がやったことになってしまいます。'
      },
      {
        head: '管理者をはめると被害が一気に拡大:',
        body: '管理者がログイン中に罠ページを開くと、利用者の権限を勝手に変えるなど大きな操作が走ります。'
      },
      {
        head: '家のルータの設定まで書き換えられる:',
        body: '家庭内ルータの管理画面に同じ手口を使われて、Wi-Fiの設定や接続先 DNS をこっそり変えられた事例もあります。'
      }
    ],
    defense: [
      {
        head: '使い捨ての合言葉(CSRFトークン)を必須にする:',
        body: 'フォームや POST API に「このページから来たことを示す使い捨ての合言葉(CSRFトークン)」を必ず付けて、サーバ側で照合します。罠ページからは合言葉が分からないので弾けます。'
      },
      {
        head: 'クッキーに「他サイト経由では送らない」設定をつける:',
        body: 'ログイン用クッキーに `SameSite=Lax` 以上の設定を付けると、別ドメインから飛んでくるリクエストにはクッキーが付かなくなり、罠ページが本人のフリをできなくなります。'
      },
      {
        head: 'リクエストの送り元(Origin)をチェック:',
        body: 'POST やAPIで「どのサイトから来たリクエストか(Origin / Referer)」を確認して、自分のサイトではない出元なら拒否します。'
      },
      {
        head: '大事な操作の前に再認証:',
        body: 'パスワード変更・送金・退会のような重要操作は、その場でパスワード再入力や追加認証(MFA)を求めます。'
      }
    ],
    devNote: [
      {
        head: 'GETリクエストで状態を変えない:',
        body: 'リンクをクリックしただけで何かが書き換わる作りは NG。データを変える操作は POST / PUT / DELETE に統一します。'
      },
      {
        head: 'CORSとは別物だと意識する:',
        body: 'CORS(別ドメインからの JS 呼び出しを制限する仕組み)は CSRF とは別の話。フォーム送信は CORS に引っかからないので、別途 CSRF トークン等で守る必要があります。'
      },
      {
        head: 'JSON APIでも油断しない:',
        body: '`Content-Type` を `text/plain` や `multipart/form-data` で送られると、ブラウザは「ふつうのリクエスト」として外部サイトから送れてしまいます。Content-Type 限定や CSRF トークンで守ります。'
      },
      {
        head: 'フレームワーク標準のCSRF対策を使う:',
        body: 'Rails / Laravel / Django / Spring などには標準で CSRF 対策が入っています。自前実装ではなく標準機能を有効にしましょう。'
      },
      {
        head: 'モバイルAPIはトークン認証にすると楽:',
        body: 'クッキー認証の代わりに `Authorization` ヘッダで JWT などを付ける作りにしておくと、CSRF はそもそも発生しにくくなります。'
      }
    ],
    steps: [
      {
        title: '攻撃者が「踏むだけで動く罠ページ」を用意する',
        description:
          '攻撃者が、見えないフォームや画像タグに「正規サイトに送り付けるリクエスト」を仕込んだ罠ページをネット上に公開します。'
      },
      {
        title: '被害者は別タブで正規サービスにログイン中',
        description:
          '被害者はその正規サービス(SNSや銀行)にログインしっぱなしで、ブラウザに「ログイン状態の目印(クッキー)」が保存されています。'
      },
      {
        title: '何かのリンクから罠ページを開いてしまう',
        description:
          'メールや SNS で送られてきた何気ないリンクから、被害者が罠ページを開いてしまいます。'
      },
      {
        title: '罠ページが裏で正規サービスに自動リクエストを送る',
        description:
          '罠ページのプログラムが、こっそり正規サービスへ「送金して」「設定変更して」などのリクエストを送ります。ブラウザは自動でクッキー(=ログイン状態)を付けてしまいます。'
      },
      {
        title: '正規サービスは本人がやったと誤解してしまう',
        description:
          '正しいクッキーが付いているので、正規サービスから見ると「本人が操作した」ようにしか見えません。CSRF トークン + SameSite クッキー で確実に防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      trap: '罠ページ',
      victim: '被害者(ログイン中)',
      vbrowser: '被害者のブラウザ',
      app: '本物のサービス'
    },
    groupLabels: {
      'trap-domain': '攻撃者が用意したサイト',
      'victim-side': '被害者の手元'
    },
    connectionLabels: {
      'logged-in': 'ログイン状態の目印を持っている'
    }
  }
};
