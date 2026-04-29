import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'directory-traversal')!;

export const directoryTraversal: AttackDefinition = {
  meta,
  caseStudy:
    'ファイルダウンロード機能の "?file=report.pdf" のようなパラメータに "../../../../etc/passwd" を指定して認証ファイルや設定ファイルを取得する事案、画像配信URLを介してアプリ内秘密鍵が流出した事例などが報告されている。',
  damage: [
    { head: '機密ファイル流出:', body: '/etc/passwd, /etc/shadow, アプリの .env や設定ファイルが取得される。' },
    { head: '秘密鍵漏洩:', body: 'SSH秘密鍵やAPIキーを取得され、他システムへの侵入に繋がる。' },
    { head: 'ソースコード漏洩:', body: 'アプリのソース・SQL・テンプレートが取得され、追加攻撃の材料になる。' }
  ],
  defense: [
    { head: '正規化してプレフィクス検証:', body: 'realpath() 等で絶対パス化し、許可ベースディレクトリの前方一致を必須に。' },
    { head: 'ファイル名IDで参照:', body: '実ファイル名を直接受け取らず、DB上のIDから内部解決。' },
    { head: '許可拡張子のホワイトリスト:', body: '.pdf/.png 等を限定し、シンボリックリンク追跡も無効化。' },
    { head: '最小権限実行:', body: 'プロセスの読込権限をアプリ用ディレクトリに限定。' }
  ],
  devNote: [
    { head: 'URLデコード後に検証:', body: '%2e%2e%2f や二重エンコード(%252e)を見落とさない。デコード後に再チェック。' },
    { head: 'OS差を意識:', body: 'Windowsではバックスラッシュやドライブ指定 (C:\\) も対象。' },
    { head: 'NUL/制御文字:', body: '"file.png\\0/etc/passwd" のようなトリックを許さない。' },
    { head: 'シンボリックリンク:', body: 'アップロード領域内のシンボリックリンクで領域外へ抜けられないようマウントオプションで制御。' },
    { head: 'ライブラリ任せにしない:', body: '"安全な静的ファイル配信" を謳うミドルウェアでも設定ミスで穴が開く。テストでカバーする。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 },  label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.45, y: 0.5 },  label: 'Webアプリ' });
    stage.addActor('public',   { pict: 'document', pos: { x: 0.78, y: 0.18 }, label: '/var/www/public' });
    stage.addActor('secret',   { pict: 'document', pos: { x: 0.78, y: 0.78 }, label: '/etc/shadow' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('"?file=../../../../etc/shadow" を投入');
          stage.sendPacket('attacker', 'app', { duration: 800, payload: '?file=../../etc/shadow' });
        }, hold: 900 },
        { run: () => {
          stage.status('アプリがパスを正規化せずに open()');
          stage.sendPacket('app', 'secret', { duration: 700, payload: 'open(path)' });
        }, hold: 800 },
        { run: () => {
          stage.flashActor('secret', 'shake', 500);
          stage.setActorPict('secret', 'unlock', '/etc/shadow');
          stage.sendPacket('secret', 'attacker', { duration: 1100, payload: 'ハッシュ化済PW一覧' });
        }, hold: 1300 },
        { run: () => stage.status('攻撃完了: パス正規化 + ベースDIR検証 + IDによる間接参照で防御') }
      ]);
    };
  }
};
