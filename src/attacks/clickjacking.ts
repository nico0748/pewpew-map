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
    stage.addGroup({ x: 0.28, y: 0.10, w: 0.30, h: 0.80, label: '罠ページ(2層構造)', variant: 'attack' });
    stage.addActor('victim', { pict: 'user',    pos: { x: 0.10, y: 0.5  }, label: '利用者' });
    stage.addActor('trap',   { pict: 'browser', pos: { x: 0.40, y: 0.30 }, label: '罠ページ(表)' });
    stage.addActor('hidden', { pict: 'browser', pos: { x: 0.40, y: 0.70 }, label: '正規ページ(透明iframe)' });
    stage.addActor('app',    { pict: 'server',  pos: { x: 0.85, y: 0.5  }, label: '正規サービス' });
    stage.addConnection('trap', 'hidden', { variant: 'aux', dashed: true, label: '重ね合わせ' });
    stage.addConnection('hidden', 'app', { variant: 'flow', dashed: true });
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
  ]
};
