import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
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
    stage.addActor('attacker',  { pict: 'attacker', pos: { x: 0.08, y: 0.5  }, label: '攻撃者' });
    stage.addActor('mail',      { pict: 'email',    pos: { x: 0.32, y: 0.5  }, label: '偽メール' });
    stage.addActor('victim',    { pict: 'user',     pos: { x: 0.55, y: 0.5  }, label: '受信者' });
    stage.addActor('fakesite',  { pict: 'browser',  pos: { x: 0.78, y: 0.22 }, label: '偽サイト' });
    stage.addActor('cred',      { pict: 'key',      pos: { x: 0.78, y: 0.78 }, label: 'ID/PW' });
    stage.addActor('attacker2', { pict: 'attacker', pos: { x: 0.95, y: 0.5  } });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('攻撃者がブランド模倣メールを送信');
          stage.sendPacket('attacker', 'mail', { duration: 700, payload: 'From: bank-support' });
        }, hold: 800 },
        { run: () => stage.sendPacket('mail', 'victim', { duration: 700, payload: '"再認証してください"' }), hold: 800 },
        { run: () => {
          stage.status('受信者がリンクをクリック → 偽サイトへ誘導');
          stage.sendPacket('victim', 'fakesite', { duration: 700, className: 'benign', payload: 'クリック' });
        }, hold: 900 },
        { run: () => {
          stage.flashActor('fakesite', 'shake', 500);
          stage.status('利用者が偽サイトに ID/PW を入力');
          stage.sendPacket('victim', 'cred', { duration: 700, className: 'benign', payload: 'ID/PW入力' });
        }, hold: 900 },
        { run: () => {
          stage.status('攻撃者が認証情報を回収');
          stage.sendPacket('cred', 'attacker2', { duration: 900, payload: '認証情報' });
        }, hold: 1100 },
        { run: () => stage.status('攻撃完了: パスキー/FIDO2 や送信ドメイン認証で防御') }
      ]);
    };
  }
};
