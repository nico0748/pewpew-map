import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'mfa-fatigue')!;

export const mfaFatigue: AttackDefinition = {
  meta,
  caseStudy:
    '2022年 Uber と Cisco が同種の手口で侵害された。攻撃者は事前に入手した正規パスワードを使ってMFAプッシュ通知を連続して被害者に飛ばし、最終的にユーザーが煩わしくなって誤承認、もしくは "IT部門を装ったSlack/SMSの誘導" を受けて承認してしまうことで突破された。番号マッチング(Number Matching)導入前のプッシュ通知型MFAの構造的弱点を突いた攻撃として広く知られる。',
  damage: [
    { head: '社内システム侵入:', body: '正規ユーザーのMFAをすり抜けてVPN/ID基盤に侵入され、横展開される。' },
    { head: '管理者乗っ取り:', body: '管理者承認が通るとIDPやSSOテナントが奪われる。' },
    { head: '長期侵害の起点:', body: 'APT/ランサムウェア攻撃の初期アクセスとして繰り返し悪用される。' },
    { head: 'インシデント検知の遅延:', body: '"認証ログ上は本人成功" のため検知が遅れる。' }
  ],
  defense: [
    { head: '番号マッチング(Number Matching):', body: 'プッシュ通知に2桁数字を表示しユーザーに入力させる。誤承認を物理的に困難に。' },
    { head: 'プッシュ通知から TOTP/Passkey へ:', body: 'プッシュ承認のみのMFAから、ハードウェアキー / FIDO2 / Passkey 中心へ移行。' },
    { head: '条件付きアクセス:', body: '不審IP/未登録端末/海外ASN等のリクエストはMFA成功後でも追加検証。' },
    { head: 'プッシュ頻度の制限:', body: '一定時間内のプッシュ送出数を上限化し、攻撃の連打を遮断。' },
    { head: 'ヘルプデスク詐称対策:', body: 'IT部門と称する電話/Slackは "コールバック必須" 等のフロー徹底。' }
  ],
  devNote: [
    { head: '"承認" は無音で簡単すぎないか:', body: '通知UIで承認ボタンを大きく押せる設計は誤承認を誘発する。番号入力やバイオ認証を挟む。' },
    { head: 'ログ設計:', body: 'プッシュの送出回数 / 拒否数 / 短時間の連続要求 を構造化ログに残し、SIEMで早期検知。' },
    { head: 'ユーザー教育の限界:', body: '"おかしいと思ったら拒否してね" だけに頼らず、技術的に誤承認を起こさせない設計を優先する。' },
    { head: '従業員向けエンドポイント:', body: 'モバイルとPCで同時にプッシュが来る環境では誤承認しやすい。優先端末を明確化する。' },
    { head: '休暇/夜間の運用:', body: '深夜帯のプッシュは特に意図しない承認が起きやすい。時間帯ベースの追加検証を入れる。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 }, label: '攻撃者' });
    stage.addActor('idp',      { pict: 'server',   pos: { x: 0.40, y: 0.5 }, label: 'IDプロバイダ' });
    stage.addActor('phone',    { pict: 'browser',  pos: { x: 0.65, y: 0.5 }, label: '被害者スマホ' });
    stage.addActor('user',     { pict: 'user',     pos: { x: 0.90, y: 0.5 }, label: '被害者' });
  },
  steps: [
    {
      title: '正規ID/PWでログイン試行',
      description: '攻撃者が事前に入手した認証情報でログインを試みる。',
      run: (stage) => {
        stage.sendPacket('attacker', 'idp', { duration: 1000, payload: '正規ID/PW' });
      }
    },
    {
      title: 'MFAプッシュが大量に飛ぶ',
      description: '攻撃者は何度もログインを繰り返し、被害者のスマホにプッシュ通知が連続で届く。',
      run: (stage) => {
        for (let i = 0; i < 6; i++) {
          stage.after(i * 280, () => stage.sendPacket('idp', 'phone', { duration: 600, payload: 'MFA push' }));
        }
      }
    },
    {
      title: '被害者が"うっかり"承認',
      description: '通知の煩わしさやIT部門を装った誘導を受けて、被害者が誤って承認してしまう。',
      run: (stage) => {
        stage.flashActor('user', 'shake', 800);
        stage.sendPacket('user', 'phone', { duration: 700, className: 'benign', payload: 'Approve' });
        stage.after(700, () => stage.sendPacket('phone', 'idp', { duration: 700, className: 'benign', payload: 'approved' }));
      }
    },
    {
      title: '攻撃者が認証通過',
      description: '攻撃者は本人扱いでログイン成功し、社内システムへの足場を得る。番号マッチング/Passkey 移行で防御可能。',
      run: (stage) => {
        stage.flashActor('idp', 'shake', 800);
        stage.sendPacket('idp', 'attacker', { duration: 1000, payload: 'session token' });
      }
    }
  ],
  beginner: {
    summary:
      '本人のスマホに「ログインしますか?」の通知を何度も送り続けて、うんざりした被害者がうっかり承認してしまうのを狙う攻撃。',
    caseStudy:
      '2022年に Uber と Cisco が同じ手口で侵入されました。攻撃者は事前に手に入れた正しいパスワードでログインを繰り返し、本人のスマホに「ログイン承認しますか?」の通知をひたすら送り続けます。あまりの煩わしさに本人が「OK」を押してしまったり、「IT部門ですが…」と Slack や SMS で連絡してきた偽の指示に従って承認してしまうことで突破されました。',
    damage: [
      {
        head: '社内システムへ侵入される:',
        body: '本人の多要素認証をすり抜けて VPN や社内ID基盤に入られ、社内ネットワークを広げられます。'
      },
      {
        head: '管理者を奪われると会社全体が制圧:',
        body: '管理者の承認が通ってしまうと、会社全体のID基盤(IDPやSSO)が奪われます。'
      },
      {
        head: '長期侵入の入口に使われる:',
        body: 'APT(長期型攻撃)やランサムウェア攻撃の最初の足場として、繰り返し悪用されます。'
      },
      {
        head: '気付くのが遅れる:',
        body: '認証ログ上は「本人が承認した」ように見えるので、不正だと気付くのが遅れます。'
      }
    ],
    defense: [
      {
        head: '番号合わせ(Number Matching)を入れる:',
        body: 'プッシュ通知に2桁の数字を表示し、PCの画面に出ている番号と同じものを利用者に入力させます。「とりあえずOK」では通らなくなります。'
      },
      {
        head: 'プッシュ承認からパスキー/ハードウェアキーへ:',
        body: '「OKを押すだけ」のプッシュ承認は誤承認しやすいので、ハードウェアキーやパスキー(WebAuthn)に移行します。'
      },
      {
        head: '状況に応じて追加チェック(条件付きアクセス):',
        body: '見覚えのないIP・未登録端末・海外からのアクセスには、多要素認証が通ってもさらに追加確認を求めます。'
      },
      {
        head: 'プッシュ通知の連打を制限:',
        body: '同じ人に短時間に何度もプッシュを送れないように、送出回数を上限化します。'
      },
      {
        head: '「IT部門詐称」電話・Slackに対策:',
        body: 'IT部門を名乗る電話や Slack は「必ずコールバックして本人確認」のような運用ルールを徹底します。'
      }
    ],
    devNote: [
      {
        head: '「承認」が簡単すぎないか見直す:',
        body: '通知のUIで巨大な承認ボタンが押しやすい位置にあると、誤承認が増えます。番号入力や生体認証を挟む。'
      },
      {
        head: 'プッシュの送出回数や拒否数をログに残す:',
        body: 'プッシュの送出数・拒否数・短時間の連続要求を構造化ログとして残し、監視基盤(SIEM)で早期検知できるようにします。'
      },
      {
        head: '教育だけに頼らない:',
        body: '「おかしいと思ったら拒否してください」というユーザ教育だけではミスはゼロにできません。技術的に誤承認できない作りを優先します。'
      },
      {
        head: '同時に複数端末にプッシュが届く構成に注意:',
        body: 'スマホとPC両方に通知が届くような構成だと、片方でうっかり承認しやすい。優先端末を明確化します。'
      },
      {
        head: '夜間・休日のプッシュは特に注意:',
        body: '深夜帯のプッシュは寝ぼけた状態での誤承認が起きやすいので、時間帯ベースで追加検証を強化します。'
      }
    ],
    steps: [
      {
        title: '攻撃者が漏洩済みのIDとパスワードでログインを試みる',
        description:
          '攻撃者は、過去の流出などで事前に手に入れた本物のIDとパスワードを使って、ログインを試みます。'
      },
      {
        title: '本人のスマホに承認通知が連打される',
        description:
          '攻撃者は何度もログインを繰り返し、本人のスマホに「ログインを承認しますか?」の通知が次々届きます。'
      },
      {
        title: '本人が煩わしさに負けて「うっかり承認」してしまう',
        description:
          '通知の鳴り続け、もしくは「IT部門です、テスト通知なので承認してください」のような偽の連絡を受けて、本人がOKを押してしまいます。'
      },
      {
        title: '攻撃者がそのまま社内システムにログイン成功',
        description:
          '本人扱いとして認証が通ってしまい、攻撃者は社内システムへの足場を得ます。番号合わせ・パスキー移行で防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      idp: 'ID管理サーバ(ログインを判定する場所)',
      phone: '本人のスマホ',
      user: '本人'
    }
  }
};
