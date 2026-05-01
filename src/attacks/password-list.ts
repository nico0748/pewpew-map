import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'password-list')!;

export const passwordList: AttackDefinition = {
  meta,
  caseStudy:
    '他社サービスから流出したID/PWの組み合わせを使い、別サービスへの自動ログインを試みる攻撃。日本でも大手SNS・ECサイト・ポイントサイトで継続発生し、利用者が "同じパスワードを使い回している" 限り被害が拡大する構造的問題となっている。',
  damage: [
    { head: '不正ログイン:', body: 'パスワード使い回しの利用者は次々と乗っ取られる。' },
    { head: 'ポイント/残高の不正利用:', body: 'マイル・ポイント・ギフト等を換金性の高い形で持ち去られる。' },
    { head: '低い検知率:', body: '"正しいID/PW" でログインするため、IPS等で検知しにくい。' },
    { head: '評判被害:', body: '"自社サービスが漏洩した" と誤認されることもある。' }
  ],
  defense: [
    { head: 'MFA必須化:', body: 'ID/PWだけでは突破できない設計。最も効果的。' },
    { head: 'パスワード再利用検知:', body: 'HIBPや組織内既知漏洩リストとの突合で警告。' },
    { head: 'デバイス/IP評価:', body: '初回端末/未知ASN/海外接続には追加認証を要求。' },
    { head: 'CAPTCHA / Bot対策:', body: '自動化された一斉試行を抑止。' },
    { head: 'リスクベース認証:', body: '不審スコアに応じてOTPや本人確認を挟む。' }
  ],
  devNote: [
    { head: 'パスキー推奨:', body: 'WebAuthn/Passkeyに移行できるなら根本的に解決する。' },
    { head: 'メール通知:', body: '新しい端末からのログイン成功時には常にメール通知し、ユーザの早期気付きを支援。' },
    { head: '"成功" の慎重な扱い:', body: '同一IP/UAから多数アカウントの成功が並ぶ挙動を検知してアラート化。' },
    { head: 'パスワード強度UI:', body: '登録時に既知漏洩パスワードを弾く。zxcvbnやAPI連携で実装。' },
    { head: '管理者向けUI:', body: '不審ログインの俯瞰ダッシュボードを用意し、初動を素早く。' }
  ],
  setup(stage) {
    stage.addGroup({ x: 0.42, y: 0.02, w: 0.54, h: 0.96, label: '標的サービス', variant: 'victim' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('list',     { pict: 'document', pos: { x: 0.25, y: 0.5  }, label: '流出ID/PWリスト' });
    stage.addActor('login',    { pict: 'server',   pos: { x: 0.55, y: 0.5  }, label: 'ログインAPI' });
    stage.addActor('a1',       { pict: 'lock',     pos: { x: 0.85, y: 0.18 }, label: 'アカウント1' });
    stage.addActor('a2',       { pict: 'lock',     pos: { x: 0.85, y: 0.50 }, label: 'アカウント2' });
    stage.addActor('a3',       { pict: 'lock',     pos: { x: 0.85, y: 0.82 }, label: 'アカウント3' });
    stage.addConnection('login', 'a1', { variant: 'flow', dashed: true });
    stage.addConnection('login', 'a2', { variant: 'flow', dashed: true });
    stage.addConnection('login', 'a3', { variant: 'flow', dashed: true });
  },
  steps: [
    {
      title: '流出済ID/PWリストを入手',
      description: '攻撃者は他社サービスから流出した認証情報リストをアンダーグラウンドで入手する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'list', { duration: 1000, payload: 'leaked.txt' });
      }
    },
    {
      title: '別サービスへ自動ログイン試行',
      description: '入手したID/PWの組み合わせを別サービスに対して機械的に投入する。',
      run: (stage) => {
        stage.sendPacket('list', 'login', { duration: 900, payload: 'user1:pwA' });
        stage.after(300, () => stage.sendPacket('list', 'login', { duration: 900, payload: 'user2:pwB' }));
        stage.after(600, () => stage.sendPacket('list', 'login', { duration: 900, payload: 'user3:pwC' }));
      }
    },
    {
      title: '使い回しユーザが突破される',
      description: 'パスワードを使い回している利用者のアカウントは次々と認証を通過してしまう。',
      run: (stage) => {
        stage.flashActor('a1', 'shake', 900);
        stage.setActorPict('a1', 'unlock', '突破');
        stage.flashActor('a3', 'shake', 900);
        stage.setActorPict('a3', 'unlock', '突破');
      }
    },
    {
      title: '攻撃者へ成功した認証情報が戻る',
      description: '成功した組み合わせのみを抽出し、後続の不正利用に活用される。MFA + 漏洩PW突合で防御可能。',
      run: (stage) => {
        stage.sendPacket('login', 'attacker', { duration: 1100, payload: '成功した認証情報' });
      }
    }
  ]
};
