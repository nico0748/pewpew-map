import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'brute-force')!;

export const bruteForce: AttackDefinition = {
  meta,
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
    stage.addActor('attacker', { pict: 'bot',     pos: { x: 0.10, y: 0.5 }, label: 'スクリプト' });
    stage.addActor('login',    { pict: 'server',  pos: { x: 0.55, y: 0.5 }, label: 'ログインAPI' });
    stage.addActor('user',     { pict: 'lock',    pos: { x: 0.85, y: 0.5 }, label: 'アカウント' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      const tries = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'iloveyou', 'P@ssw0rd!'];
      tries.forEach((pw, i) => {
        stage.after(i * 350, () => {
          stage.sendPacket('attacker', 'login', { duration: 300, payload: pw });
          stage.after(330, () => {
            if (i < tries.length - 1) {
              stage.status(`試行 ${i + 1}: 失敗 (${pw})`);
              stage.sendPacket('login', 'attacker', { duration: 250, className: 'benign', payload: '401' });
            } else {
              stage.status(`試行 ${i + 1}: 成功 (${pw}) → 突破`);
              stage.flashActor('user', 'shake', 700);
              stage.setActorPict('user', 'unlock', '突破済');
              stage.sendPacket('login', 'attacker', { duration: 400, payload: '200 OK + Cookie' });
            }
          });
        });
      });
      stage.after(tries.length * 350 + 700, () =>
        stage.status('攻撃完了: MFA + レートリミット + slow hash + 辞書ブロックで防御')
      );
    };
  }
};
