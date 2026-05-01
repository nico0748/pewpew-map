import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'phishing')!;

export const phishing: AttackDefinition = {
  meta,
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
    stage.addGroup({ x: 0.66, y: 0.04, w: 0.32, h: 0.92, label: '攻撃者インフラ', variant: 'attack' });
    stage.addActor('attacker',  { pict: 'attacker', pos: { x: 0.08, y: 0.5  }, label: '攻撃者' });
    stage.addActor('mail',      { pict: 'email',    pos: { x: 0.32, y: 0.5  }, label: '偽メール' });
    stage.addActor('victim',    { pict: 'user',     pos: { x: 0.55, y: 0.5  }, label: '受信者' });
    stage.addActor('fakesite',  { pict: 'browser',  pos: { x: 0.78, y: 0.22 }, label: '偽サイト' });
    stage.addActor('cred',      { pict: 'key',      pos: { x: 0.78, y: 0.78 }, label: 'ID/PW' });
    stage.addActor('attacker2', { pict: 'attacker', pos: { x: 0.95, y: 0.5  } });
    stage.addConnection('fakesite', 'cred', { variant: 'attack', dashed: true });
    stage.addConnection('cred', 'attacker2', { variant: 'attack', dashed: true });
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
  ]
};
