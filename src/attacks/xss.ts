import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
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
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.25 }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.50, y: 0.25 }, label: '掲示板/SNS' });
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.78 }, label: '一般利用者' });
    stage.addActor('browser',  { pict: 'browser',  pos: { x: 0.50, y: 0.78 }, label: '被害ブラウザ' });
    stage.addActor('cnc',      { pict: 'bot',      pos: { x: 0.88, y: 0.5 },  label: '攻撃者の収集サーバ' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('攻撃者が掲示板に <script> を含む投稿を保存');
          stage.sendPacket('attacker', 'app', { duration: 800, payload: '<script>fetch(...)</script>' });
        }, hold: 900 },
        { run: () => {
          stage.status('一般利用者が当該ページを閲覧');
          stage.sendPacket('victim', 'browser', { duration: 600, className: 'benign', payload: 'GET /board' });
        }, hold: 700 },
        { run: () => {
          stage.status('アプリがエスケープせず HTML をそのまま返却');
          stage.sendPacket('app', 'browser', { duration: 800, payload: '...<script>...' });
        }, hold: 900 },
        { run: () => {
          stage.flashActor('browser', 'shake', 600);
          stage.status('被害者ブラウザでスクリプトが実行され Cookie 送信');
          stage.sendPacket('browser', 'cnc', { duration: 1100, payload: 'document.cookie' });
        }, hold: 1200 },
        { run: () => stage.status('攻撃完了: 出力エスケープ + CSP + HttpOnly Cookie で防御') }
      ]);
    };
  }
};
