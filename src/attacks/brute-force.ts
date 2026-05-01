import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'brute-force')!;

export const bruteForce: AttackDefinition = {
  meta,
  appliesIf: [
    { head: 'パスワード認証のログイン機能がある:', body: '対象は Web フォームに限らず、API・SSH・RDP・SMTP・FTP・管理画面すべて。' },
    { head: 'レートリミット/ロックアウトがない:', body: '試行回数制限が無いと総当たり耐性が一切ない。' },
    { head: 'MFAが必須になっていない:', body: 'パスワード単独突破で完了する作りは現代では非推奨。' },
    { head: 'ユーザ存在の有無で応答が変わる:', body: 'メッセージや応答時間で実在ユーザを絞り込まれる。' },
    { head: 'パスワードハッシュが速いハッシュ:', body: 'MD5/SHA-1/プレーンSHA-256など。漏洩時の総当たりが極端に速くなる。' }
  ],
  caseStudy:
    'SSH/RDP/管理画面に対するパスワード総当たりは現在も常時行われている。クラウドのリージョン公開ポートに数分でログイン試行が殺到する状況は珍しくなく、辞書攻撃と組み合わせた "リスト型" との境界も曖昧化している。',
  damage: [
    { head: '不正ログイン:', body: '推測しやすいパスワードのアカウントが突破される。' },
    { head: 'アカウントロック頻発:', body: '正規利用者がロックされ業務影響に発展。' },
    { head: 'ログ汚染/負荷:', body: '大量試行でログ・認証基盤に負荷がかかる。' },
    { head: '内部システム侵入の起点:', body: 'SSH/VPN突破で社内へ侵入され、ランサムへ繋がる。' }
  ],
  defense: [
    { head: 'レートリミット + ロックアウト:', body: 'IP/アカウント単位で試行回数を制限。指数バックオフ併用。' },
    { head: '多要素認証(MFA):', body: 'パスワード突破だけでは突破できなくする。最も強力な単独対策。' },
    { head: 'パスワードポリシー:', body: '長さ重視。NIST SP 800-63B準拠で長さ&辞書ブロックを優先。' },
    { head: 'CAPTCHA:', body: '機械的試行をUX的に阻害。' },
    { head: 'WAF/IPS:', body: '既知の試行パターンとボットネットIPを遮断。' }
  ],
  devNote: [
    { head: 'ログイン失敗時の応答:', body: '"ユーザ存在/パスワード違い" を区別しない。同一エラーで返す。' },
    { head: 'タイミング差を作らない:', body: '存在判定が応答時間で漏れないように、ハッシュ計算は常に実施。' },
    { head: 'ハッシュアルゴリズム:', body: 'bcrypt / argon2id 等の slow hash を使用。stretchingコストを定期見直し。' },
    { head: 'ロックの設計:', body: 'ロックを悪用したサービス妨害(攻撃者が他人をロック)を避けるため、ロックは段階的に。' },
    { head: '監視:', body: '失敗の急増/IP分散/UA偏りを検知するアラートを用意。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'target', x: 0.42, y: 0.18, w: 0.54, h: 0.66, label: '標的サービス', variant: 'victim' });
    stage.addActor('attacker', { pict: 'bot',     pos: { x: 0.10, y: 0.5 }, label: 'スクリプト' });
    stage.addActor('login',    { pict: 'server',  pos: { x: 0.55, y: 0.5 }, label: 'ログインAPI' });
    stage.addActor('user',     { pict: 'lock',    pos: { x: 0.85, y: 0.5 }, label: 'アカウント' });
    stage.addConnection('login', 'user', { id: 'check', variant: 'flow' });
  },
  steps: [
    {
      title: 'よくあるパスワードから試す',
      description: '"password" "123456" "qwerty" のような辞書ベースで自動試行する。',
      run: (stage) => {
        ['password', '123456', 'qwerty'].forEach((pw, i) => {
          stage.after(i * 500, () => {
            stage.sendPacket('attacker', 'login', { duration: 400, payload: pw });
            stage.after(420, () => stage.sendPacket('login', 'attacker', { duration: 350, className: 'benign', payload: '401' }));
          });
        });
      }
    },
    {
      title: '試行を続ける',
      description: '失敗してもレートリミットがなければ、攻撃者は機械的に試行を続ける。',
      run: (stage) => {
        ['admin', 'letmein', 'welcome'].forEach((pw, i) => {
          stage.after(i * 500, () => {
            stage.sendPacket('attacker', 'login', { duration: 400, payload: pw });
            stage.after(420, () => stage.sendPacket('login', 'attacker', { duration: 350, className: 'benign', payload: '401' }));
          });
        });
      }
    },
    {
      title: '推測しやすいパスワードで突破',
      description: '弱いパスワードに当たると認証が成立してしまい、本人として扱われる。',
      run: (stage) => {
        stage.sendPacket('attacker', 'login', { duration: 600, payload: 'P@ssw0rd!' });
        stage.after(700, () => {
          stage.flashActor('user', 'shake', 1000);
          stage.setActorPict('user', 'unlock', '突破済');
          stage.sendPacket('login', 'attacker', { duration: 800, payload: '200 OK + Cookie' });
        });
      }
    }
  ],
  beginner: {
    summary:
      'パスワードをひたすら自動で試して、当たるまで打ち続けてアカウントに入る攻撃。',
    appliesIf: [
      { head: 'パスワードでログインできる機能がある:', body: 'Web画面・APIだけでなく、SSH(サーバへのリモート接続)・リモートデスクトップ・メールサーバなどもすべて対象です。' },
      { head: 'ログイン失敗の回数制限を入れていない:', body: '何回でも自由に試せる作りだと、総当たりに対して全く耐性がありません。' },
      { head: '多要素認証(MFA)を必須にしていない:', body: 'パスワードだけで入れる作りは、現代では推奨できません。' },
      { head: 'エラーで「ユーザいない」と「PW違う」を分けている:', body: '攻撃者に「実在ユーザはどれか」のヒントを与えてしまいます。同じエラーメッセージで返す。' },
      { head: 'パスワードを高速なハッシュで保存している:', body: 'MD5やSHA-1のような高速なハッシュは、漏洩時の総当たりに弱いです。bcryptやargon2idのような遅いハッシュに。' }
    ],
    caseStudy:
      'インターネットに公開されている SSH(サーバへのリモート接続)・RDP(リモートデスクトップ)・管理画面に対するパスワード総当たりは、今もリアルタイムで世界中で行われています。クラウドで新しくサーバを公開すると、数分以内に世界中からログイン試行が殺到します。',
    damage: [
      {
        head: '弱いパスワードのアカウントは突破される:',
        body: 'よく使われるパスワード(`123456` `password` など)を設定しているアカウントは突破されます。'
      },
      {
        head: '正規利用者がアカウントロックされる:',
        body: '失敗試行が多いとアカウントが自動ロックされ、正規利用者がログインできなくなって業務が止まります。'
      },
      {
        head: 'ログがあふれて負荷がかかる:',
        body: '大量試行で認証ログがあふれ、認証基盤自体が重くなることもあります。'
      },
      {
        head: '社内侵入の入口にされる:',
        body: 'SSH や VPN を突破されると社内ネットワークに入られ、ランサムウェアなどへ繋がります。'
      }
    ],
    defense: [
      {
        head: '一定回数で間隔を空けて止める(レートリミット):',
        body: 'IPやアカウント単位で「1分に5回まで」のように回数制限。失敗が続いたら待機時間を倍々に伸ばす(指数バックオフ)。'
      },
      {
        head: '多要素認証(MFA)を入れる:',
        body: 'パスワードが当たっただけでは入れないように、SMSやアプリ通知などの追加確認を要求します。これだけで効果が劇的に上がります。'
      },
      {
        head: '長めのパスワードを推奨:',
        body: '複雑さより長さ重視(NIST のガイドライン準拠)。よく使われるパスワード辞書に載っているものは弾く。'
      },
      {
        head: 'CAPTCHA で機械的試行を阻害:',
        body: '自動スクリプトでは突破しにくい画像認証(CAPTCHA)を入れて、機械的なログイン試行を妨害します。'
      },
      {
        head: 'WAF / IPS で既知の攻撃元を遮断:',
        body: '既知の攻撃ボットIPや攻撃パターンをWAF(攻撃を弾く番人)で自動遮断します。'
      }
    ],
    devNote: [
      {
        head: '「ユーザいない」と「パスワード違う」を区別しない:',
        body: 'エラーメッセージで「そのユーザは存在しません」と「パスワードが違います」を分けると、攻撃者が「実在ユーザ」を絞り込めてしまいます。同じエラーで返しましょう。'
      },
      {
        head: '応答時間で存在を漏らさない:',
        body: '存在しないユーザのときに早く返ると、所要時間で実在判定されます。常に同じ重い処理(ハッシュ計算)を実行して、応答時間を揃えましょう。'
      },
      {
        head: 'パスワードハッシュは「遅い」アルゴリズムを使う:',
        body: 'bcrypt や argon2id のような、計算に時間がかかる「遅いハッシュ」を使って、漏洩時の総当たり耐性を上げます。コストパラメータは定期的に見直し。'
      },
      {
        head: 'アカウントロックの設計:',
        body: 'ロックを悪用して「正規利用者を妨害する」攻撃もあります。即固定ロックではなく、まず一時ロック、その後段階的に長く、のような設計に。'
      },
      {
        head: '監視アラートを用意:',
        body: '失敗試行の急増、複数IPからの分散試行、特定のブラウザ情報(UA)に偏った試行を、監視ダッシュボードで検知できるようにしておきます。'
      }
    ],
    steps: [
      {
        title: 'よくあるパスワードを次々と試す',
        description:
          '`password` `123456` `qwerty` のような、よく使われるパスワードを辞書として、攻撃者の自動スクリプトが片っ端から試していきます。'
      },
      {
        title: 'レートリミットがないと延々と試行が続く',
        description:
          '回数制限がないシステムだと、攻撃者は機械的に何百万回でも試し続けます。'
      },
      {
        title: '弱いパスワードに当たると突破される',
        description:
          'たまたま弱いパスワードに当たると、認証が通って攻撃者が本人として認識されてしまいます。多要素認証(MFA)+ レートリミットでこの最後のステップを成立させない設計が必須です。'
      }
    ],
    actorLabels: {
      attacker: '攻撃用スクリプト',
      login: 'ログイン受付サーバ',
      user: 'アカウント'
    },
    groupLabels: {
      target: '攻撃対象のサービス'
    },
    connectionLabels: {
      check: 'パスワード照合'
    }
  }
};
