import type { AttackDefinition } from '../types';
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
    stage.addGroup({ x: 0.30, y: 0.04, w: 0.66, h: 0.30, label: '公開領域', variant: 'infra' });
    stage.addGroup({ x: 0.30, y: 0.62, w: 0.66, h: 0.34, label: '本来非公開', variant: 'attack' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5  }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.45, y: 0.5  }, label: 'Webアプリ' });
    stage.addActor('public',   { pict: 'document', pos: { x: 0.78, y: 0.18 }, label: '/var/www/public' });
    stage.addActor('secret',   { pict: 'document', pos: { x: 0.78, y: 0.78 }, label: '/etc/shadow' });
    stage.addConnection('app', 'public', { variant: 'flow' });
    stage.addConnection('app', 'secret', { variant: 'aux', dashed: true });
  },
  steps: [
    {
      title: '"../" を含むパスを送信',
      description: 'パラメータに "../../../../etc/shadow" のようなディレクトリ脱出シーケンスを含めて要求する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'app', { duration: 1100, payload: '?file=../../etc/shadow' });
      }
    },
    {
      title: 'アプリがパスを正規化せずに open()',
      description: 'アプリは公開ディレクトリ前提でファイルを開くが、パスが上位階層に到達してしまう。',
      run: (stage) => {
        stage.sendPacket('app', 'secret', { duration: 1000, payload: 'open(path)' });
      }
    },
    {
      title: '本来見せられないファイルが読まれる',
      description: '/etc/shadow など本来Webプロセスで読むべきでないファイルが読み出されてしまう。',
      run: (stage) => {
        stage.flashActor('secret', 'shake', 800);
        stage.setActorPict('secret', 'unlock', '/etc/shadow');
      }
    },
    {
      title: '攻撃者にファイル内容が流出',
      description: 'ハッシュ化済PWなど機密が漏洩。パス正規化 + ベースDIR検証 + IDによる間接参照で防御可能。',
      run: (stage) => {
        stage.sendPacket('secret', 'attacker', { duration: 1300, payload: 'ハッシュ化済PW一覧' });
      }
    }
  ]
};
