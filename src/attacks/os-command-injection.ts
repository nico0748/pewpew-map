import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'os-command-injection')!;

export const osCommandInjection: AttackDefinition = {
  meta,
  caseStudy:
    '入力値をシェルに渡す処理(画像変換ツール、pingツール、PDF生成、メール送信のsendmail呼び出し等)を踏み台に、サーバの任意コマンドを実行させ機密ファイルを取得・遠隔操作される事案が継続発生。Apache Struts などのフレームワーク脆弱性経由でも頻発。',
  damage: [
    { head: '任意コマンド実行:', body: 'rm/curl/nc 等を実行されサーバが完全に乗っ取られる。' },
    { head: '機密ファイル流出:', body: '設定ファイル/秘密鍵/.env を読み出され二次被害につながる。' },
    { head: 'バックドア設置:', body: 'リバースシェルやcron仕込みで継続的に制御される。' },
    { head: '横展開:', body: '取得したクレデンシャルで他サーバに侵入される。' }
  ],
  defense: [
    { head: 'シェルを介在させない:', body: 'execv系API/言語標準ライブラリで引数配列として渡し、shell=Falseを徹底。' },
    { head: '入力値の厳格な検証:', body: 'ホワイトリスト方式で許容文字を限定。"; | & $ ` " などを排除。' },
    { head: '最小権限実行:', body: 'WebアプリプロセスはOSの専用ユーザで動かし、書込/実行範囲を限定。' },
    { head: 'コンテナ/サンドボックス:', body: '影響範囲を限定し、横展開を抑止。' }
  ],
  devNote: [
    { head: '"system()" 系API禁止:', body: 'system()/popen()/exec()を文字列で呼び出さない。設計レビューで弾く。' },
    { head: '画像/PDF変換ツールに注意:', body: 'ImageMagick/ffmpeg/wkhtmltopdf 等は引数経由でコマンド実行に繋がる脆弱性が多い。' },
    { head: 'ファイル名のシェル渡し:', body: 'アップロードファイル名/パスを直接シェルに渡さない。UUID 等に置換する。' },
    { head: '依存ツールのCVE監視:', body: '同梱バイナリ/CLIツールの脆弱性も対象。SBOMで把握する。' },
    { head: '構造化ログ:', body: 'コマンド実行の全引数を構造化ログに残し、異常検知できるようにする。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'server-host', x: 0.30, y: 0.10, w: 0.66, h: 0.84, label: 'サーバホスト', variant: 'infra' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5  }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.45, y: 0.5  }, label: 'Webアプリ' });
    stage.addActor('os',       { pict: 'server',   pos: { x: 0.78, y: 0.30 }, label: 'OSシェル' });
    stage.addActor('files',    { pict: 'document', pos: { x: 0.78, y: 0.78 }, label: '/etc/passwd 等' });
    stage.addConnection('app', 'os', { id: 'invoke', variant: 'flow', label: 'system()' });
    stage.addConnection('os', 'files', { id: 'access', variant: 'aux', dashed: true });
  },
  steps: [
    {
      title: 'シェルメタ文字を含む入力を投入',
      description: '攻撃者が "; cat /etc/passwd" のような区切り文字+コマンドを入力欄に投入する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'app', { duration: 1100, payload: '; cat /etc/passwd' });
      }
    },
    {
      title: 'アプリが文字列連結でシェル呼び出し',
      description: 'アプリが入力をエスケープせずにシェルへ渡し、本来想定していなかったコマンドが実行される。',
      run: (stage) => {
        stage.sendPacket('app', 'os', { duration: 1000, payload: 'sh -c "ping … ; cat …"' });
      }
    },
    {
      title: 'OSが機密ファイルを読み出す',
      description: 'シェルが攻撃者の意図したコマンドを実行し、本来公開してはいけないファイルを読み出してしまう。',
      run: (stage) => {
        stage.flashActor('os', 'shake', 800);
        stage.sendPacket('os', 'files', { duration: 800, className: 'benign', payload: 'read' });
      }
    },
    {
      title: '攻撃者へ機密情報が流出',
      description: 'ファイル内容がレスポンスとして攻撃者の手に渡る。シェル介在禁止 + 引数配列 + 最小権限で防御可能。',
      run: (stage) => {
        stage.sendPacket('files', 'attacker', { duration: 1300, payload: '/etc/passwd 内容' });
      }
    }
  ],
  beginner: {
    summary:
      '入力欄に「OSへの命令文字列」を仕込まれて、サーバの中で本来動かすべきでない命令を勝手に走らせられる攻撃。',
    caseStudy:
      '画像変換ツールや ping ツール、PDF生成、メール送信のように「ユーザの入力をそのまま OS のコマンドに渡してしまう」処理で、攻撃者がサーバに対し任意の操作を走らせ、設定ファイルや秘密鍵を抜き取られて遠隔操作されてしまう事案が今も発生しています。Apache Struts のようなフレームワークの弱点経由でも頻発しています。',
    damage: [
      {
        head: 'サーバを乗っ取られる:',
        body: 'ファイルを消す・外部からファイルをダウンロードする・遠隔から操作するなど、サーバ上で何でもできる状態になります。'
      },
      {
        head: '機密ファイルが流出:',
        body: '設定ファイル・秘密鍵・`.env` といった「ここを見られたら一発アウト」のファイルを抜き取られます。'
      },
      {
        head: '裏口(バックドア)を仕掛けられる:',
        body: '常時通信の窓口や定期実行の予約(cron)を仕込まれて、しばらく後でも自由に出入りされます。'
      },
      {
        head: '他のサーバまで侵入される:',
        body: 'そこで盗んだ ID/パスワードや鍵を使って、社内の他のサーバにまで侵入を広げられます。'
      }
    ],
    defense: [
      {
        head: 'シェルを経由して呼び出さない:',
        body: '言語が用意している「引数を配列で渡してプログラムを直接起動するAPI」を使い、文字列をシェル(コマンド解釈する仕組み)に渡さないようにします。Pythonなら `subprocess` で `shell=False`、Node.js なら `execFile` のように。'
      },
      {
        head: '入力できる文字を厳しく絞る:',
        body: '英数字とハイフンだけ、のように許可文字を決めて、`;` `|` `&` `$` などのシェルで意味を持つ記号は弾きます。'
      },
      {
        head: '弱い権限のユーザでアプリを動かす:',
        body: 'Webアプリは専用の権限の弱い OS ユーザで動かして、システム全体や他人のファイルに書き込めないようにします。'
      },
      {
        head: '隔離した箱の中で動かす:',
        body: 'コンテナ(Dockerなど)やサンドボックスで動かし、万一乗っ取られても被害が外に漏れない範囲に閉じ込めます。'
      }
    ],
    devNote: [
      {
        head: '`system()` 系のAPIを使わない:',
        body: '文字列を丸ごとシェルに渡すタイプのAPI(`system()` / `popen()` / `exec(string)`)を呼ばない。レビューで見つけたら止めましょう。'
      },
      {
        head: '画像/PDF変換ツールに注意:',
        body: 'ImageMagick / ffmpeg / wkhtmltopdf などは、引数経由でOSコマンドが走ってしまう弱点が多いです。引数の組み立て方を慎重に。'
      },
      {
        head: 'アップロードされたファイル名をそのまま使わない:',
        body: '利用者が付けたファイル名をシェルに渡すと、そこに攻撃文字列が混ぜ込まれます。サーバ側で UUID(自動生成のランダム文字列)に置き換えてから扱う。'
      },
      {
        head: '同梱しているCLIツールの弱点もチェック:',
        body: 'コードだけでなく、サーバ内に同梱しているコマンドラインツールにも脆弱性があります。SBOM(使っている部品の一覧)で把握。'
      },
      {
        head: 'コマンド実行のログを構造化して残す:',
        body: '何の引数でコマンドが走ったかを構造化ログ(JSONなど)に残して、不審な実行を検知できるようにします。'
      }
    ],
    steps: [
      {
        title: '攻撃者が「シェル用の区切り記号 + コマンド」を入力する',
        description:
          '攻撃者が `; cat /etc/passwd` のように、コマンドを区切る記号 (`;`) と「中身を読み出す命令」を入力欄に放り込みます。'
      },
      {
        title: 'アプリが文字列をくっつけてシェルに渡す',
        description:
          'アプリが入力値をそのまま `ping ユーザ入力` のような形でシェルに渡してしまい、本来想定していなかったコマンドが実行されます。'
      },
      {
        title: 'OSが機密ファイルを読み出してしまう',
        description:
          'シェルが攻撃者の命令通りに動いて、本来見せてはいけない `/etc/passwd` のようなファイルを読み出します。'
      },
      {
        title: 'ファイル中身が攻撃者の手元へ',
        description:
          '読み出した中身がレスポンスとして攻撃者に渡ります。「シェル経由で呼ばない」「引数は配列で渡す」「弱い権限で動かす」の3点を守れば防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      app: 'アプリ(画面の裏で動くプログラム)',
      os: 'サーバのOSコマンド窓口',
      files: 'サーバの中の重要ファイル'
    },
    groupLabels: {
      'server-host': 'サーバ本体の中'
    },
    connectionLabels: {
      invoke: 'OSにコマンドをお願いする',
      access: 'ファイルを読み書きする'
    }
  }
};
