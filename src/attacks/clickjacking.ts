import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
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
    stage.addActor('victim', { pict: 'user',    pos: { x: 0.10, y: 0.5  }, label: '利用者' });
    stage.addActor('trap',   { pict: 'browser', pos: { x: 0.40, y: 0.30 }, label: '罠ページ(表)' });
    stage.addActor('hidden', { pict: 'browser', pos: { x: 0.40, y: 0.70 }, label: '正規ページ(透明iframe)' });
    stage.addActor('app',    { pict: 'server',  pos: { x: 0.85, y: 0.5  }, label: '正規サービス' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('利用者は"プレゼント当選!"の罠ページを開く');
          stage.sendPacket('victim', 'trap', { duration: 700, className: 'benign', payload: 'クリック誘導' });
        }, hold: 800 },
        { run: () => {
          stage.status('裏側に正規サービスの操作画面が透明iframeで重ねられている');
          stage.flashActor('hidden', 'shake', 600);
        }, hold: 800 },
        { run: () => {
          stage.status('"応募する"クリックが正規サービスの"送金/退会"を踏む');
          stage.sendPacket('trap', 'hidden', { duration: 500, payload: 'クリック透過' });
        }, hold: 600 },
        { run: () => stage.sendPacket('hidden', 'app', { duration: 900, payload: 'POST /transfer' }), hold: 1000 },
        { run: () => {
          stage.flashActor('app', 'shake', 600);
          stage.status('攻撃完了: X-Frame-Options/CSP frame-ancestors で埋め込み禁止が必須');
        } }
      ]);
    };
  }
};
