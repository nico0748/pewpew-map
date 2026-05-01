import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'phishing')!;

export const phishing: AttackDefinition = {
  meta,
  appliesIf: [
    { head: 'メールやSMSで利用者に通知を送っている:', body: 'なりすまされる側に立つリスク。SPF/DKIM/DMARC未整備だと第三者がブランドメールを偽装できる。' },
    { head: 'パスワードログインを採用している:', body: '入力させて済む認証は、利用者が偽サイトに同じ情報を入れる事故が起こり得る。' },
    { head: 'ログインドメインが乱立 / よく変わる:', body: '利用者がドメイン真贋を判別できなくなる。' },
    { head: '銀行/決済/ECなど金銭が動くサービス:', body: '攻撃の経済的旨味が大きく、ブランド模倣の標的になりやすい。' },
    { head: 'メール内に長いリダイレクトURLを含む:', body: '`track.example.com/...` のような形式は利用者が真贋判別できなくなる。' }
  ],
  caseStudy:
    '銀行・宅配・キャリア決済を装ったSMS(スミッシング)で「再認証してください」と誘導し、本物そっくりのログイン画面でID/PWとSMS認証コードを入力させ、即座に不正送金される事案が継続的に発生している。',
  damage: [
    { head: '認証情報窃取:', body: 'ID/PW/SMS OTP まで奪われ、本人なりすまし操作が行われる。' },
    { head: '不正送金/不正利用:', body: 'ネット銀行や決済サービスの残高が不正送金される。' },
    { head: '個人情報漏洩:', body: '住所・電話・カード番号などをまとめて入力させられる。' },
    { head: '二次被害:', body: '取得情報が他サービスへのリスト型攻撃の材料となる。' }
  ],
  defense: [
    { head: '送信ドメイン認証:', body: 'SPF / DKIM / DMARC で正規メールを保証、なりすまし送信を排除。' },
    { head: 'パスキー / FIDO2:', body: 'ドメインに紐付くため偽サイトに誤入力しても認証成立しない。' },
    { head: '利用者教育:', body: 'メール内リンクから入らずブックマーク経由でアクセスする習慣付け。' },
    { head: 'URL/ブランド監視:', body: '類似ドメイン取得を継続的に監視・通報。' },
    { head: 'リスクベース認証:', body: '普段と異なる端末/IPでの操作を追加認証で阻止。' }
  ],
  devNote: [
    { head: 'ログインドメインを統一:', body: '本番のログインを login.example.com 等に固定し利用者に学習させる。サブドメインを乱立させない。' },
    { head: 'メール内リンクの設計:', body: 'クリック計測用のリダイレクタは利用者を混乱させ、訓練効果も下げる。' },
    { head: 'パスキー対応:', body: '可能ならパスワード+OTPではなくWebAuthn/Passkeyで認証する。' },
    { head: 'CSRF/Origin検証:', body: 'リアルタイム中継型フィッシング対策のため Origin/Referer検証は重要。' },
    { head: 'お知らせメールの整備:', body: '正規メールにリンクを含めない・あるいは含める形式を一貫させ、利用者が真贋判別しやすくする。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'attacker-infra', x: 0.66, y: 0.04, w: 0.32, h: 0.92, label: '攻撃者インフラ', variant: 'attack' });
    stage.addActor('attacker',  { pict: 'attacker', pos: { x: 0.08, y: 0.5  }, label: '攻撃者' });
    stage.addActor('mail',      { pict: 'email',    pos: { x: 0.32, y: 0.5  }, label: '偽メール' });
    stage.addActor('victim',    { pict: 'user',     pos: { x: 0.55, y: 0.5  }, label: '受信者' });
    stage.addActor('fakesite',  { pict: 'browser',  pos: { x: 0.78, y: 0.22 }, label: '偽サイト' });
    stage.addActor('cred',      { pict: 'key',      pos: { x: 0.78, y: 0.78 }, label: 'ID/PW' });
    stage.addActor('attacker2', { pict: 'attacker', pos: { x: 0.95, y: 0.5  } });
    stage.addConnection('fakesite', 'cred', { id: 'capture', variant: 'attack', dashed: true });
    stage.addConnection('cred', 'attacker2', { id: 'forward', variant: 'attack', dashed: true });
  },
  steps: [
    {
      title: 'ブランド模倣メールを大量送信',
      description: '攻撃者が銀行・宅配・キャリア決済等の正規ブランドを装ったメール/SMSを大量送信する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'mail', { duration: 1000, payload: 'From: bank-support' });
      }
    },
    {
      title: '受信者のもとに届く',
      description: '"再認証してください" "支払いに失敗しました" など緊急性を煽る文面が表示される。',
      run: (stage) => {
        stage.sendPacket('mail', 'victim', { duration: 1000, payload: '"再認証してください"' });
      }
    },
    {
      title: 'リンクをクリックして偽サイトへ',
      description: '受信者がメール内リンクをクリックし、本物そっくりに作られた偽ログイン画面に誘導される。',
      run: (stage) => {
        stage.sendPacket('victim', 'fakesite', { duration: 1000, className: 'benign', payload: 'クリック' });
      }
    },
    {
      title: '偽サイトでID/PWを入力してしまう',
      description: '偽サイトのフォームに正規認証情報を入力してしまう。',
      run: (stage) => {
        stage.flashActor('fakesite', 'shake', 800);
        stage.sendPacket('victim', 'cred', { duration: 1000, className: 'benign', payload: 'ID/PW入力' });
      }
    },
    {
      title: '攻撃者が認証情報を回収',
      description: '入力された情報は即座に攻撃者へ転送される。パスキー/FIDO2 や送信ドメイン認証で防御可能。',
      run: (stage) => {
        stage.sendPacket('cred', 'attacker2', { duration: 1100, payload: '認証情報' });
      }
    }
  ],
  beginner: {
    summary:
      '銀行や宅配などになりすましたメール/SMSで「本物そっくり」の偽サイトに誘導され、IDやパスワードを盗まれてしまう詐欺。',
    appliesIf: [
      { head: '利用者にメールやSMSで通知を送っている:', body: 'メールの「送信者証明」(SPF/DKIM/DMARC)を設定していないと、誰でも自分の名前で送れるようになり、被害に巻き込まれます。' },
      { head: 'パスワードでログインさせている:', body: 'パスワードを利用者に入力させる作りは、偽サイトに同じパスワードを入れられてしまう事故が起きやすい。' },
      { head: 'ログイン画面のドメインがバラバラ:', body: '`example.com` と `example-login.com` のように複数あると、利用者は本物と偽物を見分けられません。' },
      { head: 'お金が動くサービスを運営している:', body: '銀行・決済・ECは攻撃者にとって儲かるので、ブランドが偽装される確率が高い。' },
      { head: 'メール内に長いリダイレクトURLを使っている:', body: '`track.example.com/abc123` のようなURLを使うと、利用者が「本物のリンク」を見分けられなくなります。' }
    ],
    caseStudy:
      '銀行・宅配・キャリア決済を装ったSMS(スミッシングと呼びます)で「再認証してください」と急かす内容を送り、本物そっくりのログイン画面で ID・パスワード・SMSで送られてくる認証コードまで入力させて、すぐに不正送金される事件が今も続発しています。',
    damage: [
      {
        head: 'IDとパスワードを盗まれる:',
        body: 'ID・パスワード・SMS の認証コードまで奪われ、本人になりすまして操作されます。'
      },
      {
        head: '勝手に送金される:',
        body: 'ネット銀行や決済サービスの残高を、攻撃者の口座に送金されてしまいます。'
      },
      {
        head: '個人情報がまとめて流出:',
        body: '住所・電話番号・カード番号などをまとめて入力させられて、丸ごと盗まれます。'
      },
      {
        head: '他のサービスでも被害が広がる:',
        body: '盗んだIDとパスワードで、他のサービスにもログインを試されてしまいます(パスワード使い回しの罠)。'
      }
    ],
    defense: [
      {
        head: '送信元の証明書をチェックする仕組み(SPF/DKIM/DMARC):',
        body: 'メールが「本当にそのドメインから送られた」かをチェックする3つの仕組み(SPF / DKIM / DMARC)を設定して、なりすましメールを弾けるようにします。'
      },
      {
        head: 'パスキー(端末に紐づくログイン)を使う:',
        body: 'パスキー / FIDO2 という「ログインしたいサイトのドメインに自動で紐づいて動く認証」を使えば、偽サイトに入力しても認証が成立しません。'
      },
      {
        head: '利用者の習慣づけ:',
        body: 'メール内のリンクからではなく、ブックマーク経由で公式サイトに入る、と利用者に学んでもらう。'
      },
      {
        head: '似たドメインを監視する:',
        body: '自社ブランドに似た紛らわしいドメイン(例: rnybank.com / mybаnk.com 等)が登録されていないか、定期的に監視して通報します。'
      },
      {
        head: '普段と違う使い方を検知する認証(リスクベース認証):',
        body: 'いつもと違う端末・場所からのログインには追加で本人確認を求めるなど、状況によって認証強度を変える仕組みを入れます。'
      }
    ],
    devNote: [
      {
        head: 'ログイン画面のドメインを統一する:',
        body: 'ログインを `login.example.com` のような決まった場所に固定して、利用者に「ここ以外は偽物」と覚えてもらいます。サブドメインを乱立させない。'
      },
      {
        head: 'メール内リンクの設計:',
        body: 'クリック計測のために `track.example.com` のようなリダイレクト URL を経由させると、利用者が真贋判別できなくなります。極力使わない。'
      },
      {
        head: 'パスワードよりパスキー:',
        body: '可能ならパスワード+ワンタイムコードよりも、WebAuthn / パスキーで認証する作りにしましょう。フィッシング耐性が圧倒的に高いです。'
      },
      {
        head: 'リアルタイム中継型対策:',
        body: '偽サイトが入力をその場で本物に転送する手口(リアルタイム中継型)に対しては、`Origin` / `Referer` ヘッダ検証も併用します。'
      },
      {
        head: 'お知らせメールの形式を統一:',
        body: '正規メールではリンクを使わない、あるいは形式を一貫させて、利用者が真贋を見分けやすくします。'
      }
    ],
    steps: [
      {
        title: '攻撃者が「本物っぽい」メールを大量送信',
        description:
          '攻撃者が銀行・宅配・通信会社などの正規ブランドになりすましたメールやSMSを、大量にばらまきます。'
      },
      {
        title: '受信者の手元に届く',
        description:
          '「再認証してください」「支払いに失敗しました」のように、急かす文面で利用者を慌てさせます。'
      },
      {
        title: 'リンクを踏んで「本物そっくりの偽サイト」へ',
        description:
          '受信者がメール内のリンクを押すと、本物と見分けがつかないログイン画面が出てきます。'
      },
      {
        title: 'IDとパスワードを偽サイトに入力してしまう',
        description:
          '見た目に騙されて、本物のつもりで偽サイトにログイン情報を入力してしまいます。'
      },
      {
        title: '入力した情報がそのまま攻撃者の手に',
        description:
          '偽サイトに入った情報は即座に攻撃者へ送られます。パスキー(ドメインに紐づく認証)と送信ドメイン認証で根本的に防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      mail: '偽メール / SMS',
      victim: '受け取った人',
      fakesite: '本物そっくりの偽サイト',
      cred: '盗まれたID / パスワード'
    },
    groupLabels: {
      'attacker-infra': '攻撃者の道具'
    },
    connectionLabels: {
      capture: '入力された情報を捕まえる',
      forward: '攻撃者に転送'
    }
  }
};
