import { Stage, sequence } from '../../assets/js/animator.js';
import { renderAttackPage } from '../../assets/js/page.js';

const stage = new Stage('#stage');
stage.addActor('attacker', 'attacker', { x: 0.10, y: 0.25 }, '攻撃者');
stage.addActor('app',      'server',   { x: 0.50, y: 0.25 }, '掲示板/SNS');
stage.addActor('victim',   'user',     { x: 0.10, y: 0.78 }, '一般利用者');
stage.addActor('browser',  'browser',  { x: 0.50, y: 0.78 }, '被害ブラウザ');
stage.addActor('cnc',      'bot',      { x: 0.88, y: 0.5 },  '攻撃者の収集サーバ');

renderAttackPage({
  title: 'クロスサイトスクリプティング',
  titleEn: 'Cross-Site Scripting (XSS)',
  caseStudy: '大手ECサイトのレビュー欄に <script> が投稿可能になっており、閲覧者のセッションCookieが攻撃者サーバへ送信され、なりすましログインに悪用された事例が多数報告されている。',
  damage: [
    { head: 'セッションCookie窃取:', body: 'document.cookieを送信され、なりすましログインされる。' },
    { head: '個人情報入力の盗聴:', body: 'フォーム入力値をキー入力単位で外部送信される。' },
    { head: '画面改ざん:', body: 'フィッシングフォームを差し込まれ、利用者を誤誘導される。' },
    { head: 'マルウェア配布:', body: '正規サイト閲覧から不正サイトへ自動遷移させられる。' }
  ],
  defense: [
    { head: '出力時エスケープ:', body: 'HTML/属性/JS/URL の文脈ごとに正しくエスケープ。テンプレートエンジンの自動エスケープを有効化。' },
    { head: 'CSP設定:', body: "Content-Security-Policy で script-src を制限し、インラインスクリプト実行を抑止。" },
    { head: 'HttpOnly Cookie:', body: 'セッションCookieはJSから読めなくする。Secure/SameSiteも併用。' },
    { head: '入力検証:', body: 'ホワイトリスト方式で許容文字を限定。' },
    { head: 'リッチテキスト用サニタイザ:', body: 'DOMPurify等の実績あるライブラリを使う。' }
  ],
  devNote: [
    { head: '"安全なAPIだけ使う":', body: 'innerHTML / dangerouslySetInnerHTML / v-html を避け、textContent や {{ }} を使う。' },
    { head: 'href/src属性の検証:', body: "javascript: スキームや data: URLを許可しない。" },
    { head: 'JSONをHTMLに埋め込む際:', body: '/<\\/script>/ や < > を必ずエスケープ。' },
    { head: 'CSP nonce/hash:', body: 'インラインscriptが必要な場合はnonce/hashで限定。' },
    { head: 'WAFは万能ではない:', body: '出力エスケープ等の根本対策と組み合わせる。' }
  ]
});

document.getElementById('play').addEventListener('click', play);
document.getElementById('reset').addEventListener('click', () => { stage.reset(); stage.status('準備完了'); });

function play() {
  stage.reset();
  stage.status('攻撃シナリオ再生中…');

  sequence([
    { delay: 0, run: () => {
      stage.status('攻撃者が掲示板に <script> を含む投稿を保存');
      stage.sendPacket('attacker', 'app', { duration: 800, payload: '<script>fetch(...)</script>' });
    }, hold: 900 },
    { delay: 0, run: () => {
      stage.status('一般利用者が当該ページを閲覧');
      stage.sendPacket('victim', 'browser', { duration: 600, className: 'benign', payload: 'GET /board' });
    }, hold: 700 },
    { delay: 0, run: () => {
      stage.status('アプリがエスケープせず HTML をそのまま返却');
      stage.sendPacket('app', 'browser', { duration: 800, payload: '...<script>...' });
    }, hold: 900 },
    { delay: 0, run: () => {
      stage.flashActor('browser', 'shake', 600);
      stage.status('被害者ブラウザでスクリプトが実行され Cookie 送信');
      stage.sendPacket('browser', 'cnc', { duration: 1100, payload: 'document.cookie' });
    }, hold: 1200 },
    { delay: 0, run: () => {
      stage.status('攻撃完了: 出力エスケープ + CSP + HttpOnly Cookie で防御');
    }, hold: 0 }
  ]);
}
