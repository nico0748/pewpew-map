import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'sql-injection')!;

export const sqlInjection: AttackDefinition = {
  meta,
  caseStudy:
    '2011年 ソニーの関連サービスでSQLインジェクションにより数千万件規模の利用者情報が流出。2015年 大手通販サイトでも同種の事案で個人情報・カード情報が窃取された。',
  damage: [
    { head: '情報漏洩:', body: '会員情報・カード情報・社内機密などをDBから一括で抜かれる。' },
    { head: '改ざん/削除:', body: '価格・権限・記事などを書き換えられ、業務停止に直結。' },
    { head: '認証回避:', body: "「' OR 1=1 --」のような構文で管理画面にログインされる。" },
    { head: '横展開:', body: 'DB権限を起点にOSコマンド実行や他サーバ侵入へ繋がる。' }
  ],
  defense: [
    { head: 'プレースホルダ/バインド変数:', body: '文字列連結でSQLを組み立てない。最も確実な対策。' },
    { head: '最小権限のDBユーザ:', body: 'アプリ用DBユーザに DROP/GRANT などの権限を与えない。' },
    { head: 'WAF導入:', body: '既知の攻撃パターンを多層防御で遮断。' },
    { head: 'エラー詳細の非表示:', body: 'SQLエラーを画面/ログに露出させない。' },
    { head: '入力値の型チェック:', body: '数値項目は数値であることをアプリ層で検証。' }
  ],
  devNote: [
    { head: 'ORM任せにしない:', body: '生SQLを書くAPIや LIKE / ORDER BY 列名のような可変箇所は注意。' },
    { head: 'IDの型を意識:', body: 'パスパラメータの数値IDは Number(strict) で受ける。' },
    { head: 'マイグレーション/管理スクリプト:', body: '本番DBに対する直接実行ツールも対象。社内向けでも例外にしない。' },
    { head: 'ログ出力時のサニタイズ:', body: '入力値をそのままログに書くと2次インジェクションが起きうる。' },
    { head: '静的解析/テスト:', body: 'sqlmap風テスト・lint・依存ライブラリのCVE監視をCIに組み込む。' }
  ],
  setup(stage) {
    stage.addGroup({ x: 0.36, y: 0.18, w: 0.60, h: 0.66, label: 'サーバサイド', variant: 'infra' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.50, y: 0.5 }, label: 'Webアプリ' });
    stage.addActor('db',       { pict: 'database', pos: { x: 0.88, y: 0.5 }, label: 'DB' });
    stage.addConnection('app', 'db', { variant: 'flow', label: 'SQL' });
  },
  steps: [
    {
      title: '攻撃ペイロードの投入',
      description: "攻撃者が入力欄に「' OR 1=1 --」のようなSQL断片を含む文字列を投入する。",
      run: (stage) => {
        stage.sendPacket('attacker', 'app', { duration: 1100, payload: "' OR 1=1 --" });
      }
    },
    {
      title: 'SQL文が組み立てられDBへ送信',
      description: 'アプリが入力値を文字列連結でSQLに埋め込み、意図しないSELECT文がDBへ送信される。',
      run: (stage) => {
        stage.sendPacket('app', 'db', { duration: 1100, payload: 'SELECT * WHERE id=… OR 1=1' });
      }
    },
    {
      title: 'DBが全件を返却',
      description: '"OR 1=1" により条件が常に真となり、DBがテーブル全行を返却してしまう。',
      run: (stage) => {
        stage.flashActor('db', 'shake', 1000);
        stage.sendPacket('db', 'attacker', {
          duration: 1300,
          className: 'benign',
          payload: '全テーブルの行を返却'
        });
      }
    },
    {
      title: '情報漏洩成立',
      description: '本来見せるべきでないデータが攻撃者の手元に渡る。バインド変数を使えば防げた典型例。',
      run: (stage) => {
        stage.flashActor('attacker', 'shake', 800);
      }
    }
  ]
};
