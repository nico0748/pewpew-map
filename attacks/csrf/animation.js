import { Stage, sequence } from '../../assets/js/animator.js';
import { renderAttackPage } from '../../assets/js/page.js';

const stage = new Stage('#stage');
stage.addActor('attacker', 'attacker', { x: 0.10, y: 0.20 }, '攻撃者');
stage.addActor('trap',     'browser',  { x: 0.40, y: 0.20 }, '罠サイト');
stage.addActor('victim',   'user',     { x: 0.10, y: 0.78 }, '被害者(ログイン中)');
stage.addActor('vbrowser', 'browser',  { x: 0.40, y: 0.78 }, '被害者ブラウザ');
stage.addActor('app',      'server',   { x: 0.85, y: 0.5 },  '正規サービス');

renderAttackPage({
  title: 'クロスサイトリクエストフォージェリ',
  titleEn: 'Cross-Site Request Forgery (CSRF)',
  caseStudy: '2005年 mixi の "ぼくはまちちゃん!" 事件、2012年 遠隔操作ウイルス事件で掲示板に書き込ませた踏み台URLなど、ログイン中の利用者に意図しない投稿/設定変更を行わせる事案が国内外で多数発生している。',
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
  ]
});

document.getElementById('play').addEventListener('click', play);
document.getElementById('reset').addEventListener('click', () => { stage.reset(); stage.status('準備完了'); });

function play() {
  stage.reset();
  stage.status('攻撃シナリオ再生中…');

  sequence([
    { delay: 0, run: () => {
      stage.status('攻撃者が罠サイトを設置(隠しフォーム/img)');
      stage.sendPacket('attacker', 'trap', { duration: 700, payload: '<form action=正規 …>' });
    }, hold: 800 },
    { delay: 0, run: () => {
      stage.status('被害者は正規サービスにログイン中');
      stage.sendPacket('victim', 'vbrowser', { duration: 500, className: 'benign', payload: '正規ログイン済' });
    }, hold: 700 },
    { delay: 0, run: () => {
      stage.status('別タブで罠サイトを閲覧');
      stage.sendPacket('vbrowser', 'trap', { duration: 600, className: 'benign', payload: 'GET 罠ページ' });
    }, hold: 700 },
    { delay: 0, run: () => {
      stage.status('罠ページのJSが正規サービスへ自動POST(Cookie同送)');
      stage.sendPacket('vbrowser', 'app', { duration: 1000, payload: 'POST /transfer (+Cookie)' });
    }, hold: 1100 },
    { delay: 0, run: () => {
      stage.flashActor('app', 'shake', 600);
      stage.status('正規サービスは "本人の操作" として処理してしまう');
    }, hold: 800 },
    { delay: 0, run: () => {
      stage.status('攻撃完了: CSRFトークン + SameSite Cookie で防御');
    }, hold: 0 }
  ]);
}
