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
    stage.addGroup({ x: 0.02, y: 0.62, w: 0.62, h: 0.34, label: '被害者側', variant: 'victim' });
    stage.addGroup({ x: 0.74, y: 0.30, w: 0.24, h: 0.40, label: '攻撃者インフラ', variant: 'attack' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.25 }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.50, y: 0.25 }, label: '掲示板/SNS' });
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.78 }, label: '一般利用者' });
    stage.addActor('browser',  { pict: 'browser',  pos: { x: 0.50, y: 0.78 }, label: '被害ブラウザ' });
    stage.addActor('cnc',      { pict: 'bot',      pos: { x: 0.88, y: 0.5 },  label: '攻撃者の収集サーバ' });
    stage.addConnection('victim', 'browser', { variant: 'flow' });
    stage.addConnection('browser', 'app', { variant: 'flow', dashed: true });
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
  ]
};
