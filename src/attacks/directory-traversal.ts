import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'directory-traversal')!;

export const directoryTraversal: AttackDefinition = {
  meta,
  appliesIf: [
    { head: 'ファイルダウンロード機能がある:', body: '`?file=xxx.pdf` のようにファイル名/パスをパラメータで受け取り、サーバ側で開いている。' },
    { head: '画像/動画配信のURLにファイル名が露出:', body: '`/files/:name` のように直接ファイル名を受けて配信する作り。' },
    { head: 'テンプレートや言語ファイルを動的に読み込む:', body: 'ロケールやテーマ名などをパスに使う処理は traversal の温床。' },
    { head: '社内ツール/管理画面でログ閲覧機能がある:', body: '社内向けでも本番ファイルを読む経路があるなら同様に対象。' },
    { head: 'ZIPやアーカイブ展開機能がある:', body: 'ZIPSlip のように、展開時のパス検証ミスで領域外書き込みが起きるケースも同種。' }
  ],
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
    stage.addGroup({ id: 'public-area', x: 0.30, y: 0.04, w: 0.66, h: 0.30, label: '公開領域', variant: 'infra' });
    stage.addGroup({ id: 'private-area', x: 0.30, y: 0.62, w: 0.66, h: 0.34, label: '本来非公開', variant: 'attack' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5  }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.45, y: 0.5  }, label: 'Webアプリ' });
    stage.addActor('public',   { pict: 'document', pos: { x: 0.78, y: 0.18 }, label: '/var/www/public' });
    stage.addActor('secret',   { pict: 'document', pos: { x: 0.78, y: 0.78 }, label: '/etc/shadow' });
    stage.addConnection('app', 'public', { id: 'normal', variant: 'flow' });
    stage.addConnection('app', 'secret', { id: 'leak', variant: 'aux', dashed: true });
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
  ],
  beginner: {
    summary:
      'URL に「../」のような「上のフォルダに戻れ」という指示を混ぜ込まれて、見せてはいけない場所のファイルまで読まれてしまう攻撃。',
    appliesIf: [
      { head: 'ファイルをダウンロードできる機能がある:', body: 'URLにファイル名を含めて指定する作り(`?file=report.pdf` のような形)はとくに要注意。' },
      { head: '画像配信のURLにファイル名がそのまま入る:', body: '`/images/abc.png` のように利用者が指定できるパス構造になっている場合。' },
      { head: '言語切り替えやテーマでファイル名をURLから受ける:', body: 'ロケールやテーマ名をパスに使う作りも危険。' },
      { head: '管理画面でサーバ上のログファイルを表示している:', body: '社内向けでも、サーバのファイルを読む経路があれば対象です。' },
      { head: 'ZIPファイルを受け取って展開している:', body: 'ZIPの中身に細工された相対パスがあると、想定外の場所に書き込まれることがあります。' }
    ],
    caseStudy:
      '「ファイルダウンロード機能」のURLパラメータ `?file=report.pdf` の代わりに `../../../../etc/passwd` を入れて、サーバ内部の認証用ファイルや設定ファイルを取得されてしまった事案や、画像配信URL経由でアプリの秘密鍵が流出した事例が報告されています。',
    damage: [
      {
        head: '機密ファイルが流出:',
        body: 'パスワード情報が入った OS のファイルや、アプリの設定ファイル(`.env` など機密の塊)を取得されてしまいます。'
      },
      {
        head: '秘密鍵を抜かれる:',
        body: 'SSH の秘密鍵や API キーを抜き取られて、他のサービス・サーバへの侵入につながります。'
      },
      {
        head: 'ソースコードが流出:',
        body: 'アプリ本体のコードや SQL、テンプレートまで取得されてしまい、追加攻撃の材料にされます。'
      }
    ],
    defense: [
      {
        head: 'パスを「整えてから」許可された場所に収まっているか確認:',
        body: '受け取ったパスを最終的な絶対パス(realpath)に直してから、「アプリが公開してよいフォルダの中に収まっているか」を必ず確認します。'
      },
      {
        head: 'ファイル名の代わりにIDで指定:',
        body: 'URL ではファイル名ではなく `?id=42` のような番号を受け取り、サーバ側のテーブルから本当のファイル名を引いてくる作りにすれば、ユーザがパスを直接指定する余地がなくなります。'
      },
      {
        head: '許可する拡張子を決める:',
        body: '`.pdf` や `.png` のように決まった拡張子だけを許可。シンボリックリンク(別の場所への近道)を辿らない設定もセットで。'
      },
      {
        head: '弱い権限のユーザでアプリを動かす:',
        body: 'Webプロセスの読み込み権限を、アプリ用フォルダだけに絞っておけば、万一抜けても被害が広がりません。'
      }
    ],
    devNote: [
      {
        head: 'URLのデコード後に再チェック:',
        body: '`%2e%2e%2f` (=`../` を URL エンコードしたもの)や、二重にエンコードされた `%252e` などの抜け穴を見落とさないように、デコードしてから検証します。'
      },
      {
        head: 'OSの違いを意識する:',
        body: 'Windows ではバックスラッシュ (`\\`) や `C:\\...` のドライブ指定もパス区切りになります。両方を考慮。'
      },
      {
        head: 'NUL文字で切られる罠:',
        body: '`file.png\\0/etc/passwd` のように途中に NUL 文字を仕込まれて拡張子チェックを潜られる手口も。NUL や制御文字は弾く。'
      },
      {
        head: 'シンボリックリンクで外に出られないように:',
        body: 'アップロード領域に「外側へのリンク」を作られると、そこから外に出られてしまいます。マウントオプションでリンク追跡を制限。'
      },
      {
        head: 'ライブラリを過信しない:',
        body: '「安全な静的ファイル配信」を謳うミドルウェアでも、設定を間違えると穴が空きます。テストで実際に `../` が通らないことを確認しましょう。'
      }
    ],
    steps: [
      {
        title: '攻撃者がURLに「../」を仕込む',
        description:
          'URL のパラメータに `../../../../etc/shadow` のような、「上の階層に戻る」という意味の `../` を何回も含めた値を指定します。'
      },
      {
        title: 'アプリがパスを整えずにファイルを開く',
        description:
          'アプリは公開フォルダ内で開くつもりが、`../` を解釈して、想定よりずっと上の階層のファイルに到達してしまいます。'
      },
      {
        title: '本来見せられない場所のファイルが読まれる',
        description:
          'パスワード情報を保管している `/etc/shadow` のような、本来 Web アプリから読むべきでないファイルまで読み出されてしまいます。'
      },
      {
        title: '攻撃者にファイル中身が渡る',
        description:
          'ファイルの中身がレスポンスとして攻撃者の手に渡ります。「絶対パスに直してから許可フォルダ内か確認」と「IDで間接的に参照」をすれば防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      app: 'アプリ(画面の裏で動くプログラム)',
      public: '公開していい場所のファイル',
      secret: '本来見せてはいけないファイル'
    },
    groupLabels: {
      'public-area': '公開していい場所',
      'private-area': '本来見せてはいけない場所'
    },
    connectionLabels: {
      normal: '本来のファイル参照',
      leak: '抜け穴で参照'
    }
  }
};
