import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'targeted-attack')!;

export const targetedAttack: AttackDefinition = {
  meta,
  caseStudy:
    '2015年 日本年金機構の標的型メールによる事案で約125万件の個人情報流出。海外でも国家関与とされるAPTグループによる長期潜伏(数か月〜数年)型の侵害が、製造業・防衛関連・研究機関・自治体に対して継続報告されている。',
  damage: [
    { head: '機密情報の継続的な窃取:', body: '研究データ・設計図・経営情報・人事情報が長期間にわたり流出。' },
    { head: '権限昇格と横展開:', body: 'AD/ドメインを掌握され、組織全体が制圧される。' },
    { head: 'バックドア常駐:', body: '通常のIT運用では気付けず、再侵入が容易に行われる。' },
    { head: '取引先への波及:', body: '窃取情報が取引先・顧客に対する追加攻撃に使われる。' }
  ],
  defense: [
    { head: '多層防御 (Defense in Depth):', body: '入口/内部/出口の各境界で異常検知を組み合わせる。' },
    { head: 'ゼロトラスト:', body: '社内ネットワーク=安全という前提を捨て、各通信を都度検証。' },
    { head: 'EDR + SIEM + SOC:', body: '横展開・C2通信を行動ベースで検知し封じ込め。' },
    { head: '訓練:', body: '標的型メール訓練と机上演習を定期実施。' },
    { head: '特権アカウント管理(PAM):', body: '管理者権限の常時保有を避け、貸出・記録・自動失効。' }
  ],
  devNote: [
    { head: 'ログ集約と保全:', body: '攻撃の全体像を後から再構築できるよう、認証ログ/プロキシログ/EDRログを長期保管。' },
    { head: '出口対策(C2通信遮断):', body: '社内→外部の通信もホワイトリスト/プロキシ強制で監視。' },
    { head: '"VPN/SaaS資格情報" の保護:', body: '生産性向上のために緩めた認証は侵入の本命入口になる。' },
    { head: 'シークレット管理:', body: 'コードや設定ファイルにAPIキー/接続情報を残さない。Secret Managerを使う。' },
    { head: 'インシデント想定の設計:', body: 'アプリ側でも"侵害された前提"の権限分離・監査ログを実装する。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: 'APTグループ' });
    stage.addActor('mail',     { pict: 'email',    pos: { x: 0.25, y: 0.5  }, label: '標的型メール' });
    stage.addActor('employee', { pict: 'user',     pos: { x: 0.45, y: 0.5  }, label: '従業員' });
    stage.addActor('endpoint', { pict: 'browser',  pos: { x: 0.65, y: 0.20 }, label: '感染端末' });
    stage.addActor('ad',       { pict: 'server',   pos: { x: 0.65, y: 0.80 }, label: '社内AD/ファイルサーバ' });
    stage.addActor('exfil',    { pict: 'document', pos: { x: 0.90, y: 0.5  }, label: '機密データ' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('業務に偽装した標的型メールを送付');
          stage.sendPacket('attacker', 'mail', { duration: 700, payload: '請求書.docx (マクロ付)' });
        }, hold: 900 },
        { run: () => {
          stage.sendPacket('mail', 'employee', { duration: 700, payload: '"確認お願いします"' });
        }, hold: 800 },
        { run: () => {
          stage.status('従業員が添付ファイルを開く → 端末が感染');
          stage.sendPacket('employee', 'endpoint', { duration: 700, className: 'benign', payload: '開封' });
        }, hold: 800 },
        { run: () => {
          stage.flashActor('endpoint', 'shake', 800);
          stage.status('長期潜伏 → 認証情報を収集 → 横展開');
          stage.sendPacket('endpoint', 'ad', { duration: 1000, payload: 'lateral movement' });
        }, hold: 1100 },
        { run: () => {
          stage.flashActor('ad', 'shake', 600);
          stage.status('機密情報を集約 → 暗号化して外部送信');
          stage.sendPacket('ad', 'exfil', { duration: 700, className: 'benign', payload: 'collect' });
        }, hold: 800 },
        { run: () => {
          stage.sendPacket('exfil', 'attacker', { duration: 1100, payload: 'encrypted exfil' });
        }, hold: 1200 },
        { run: () => stage.status('攻撃完了: 多層防御 + ゼロトラスト + EDR/SIEMで継続検知') }
      ]);
    };
  }
};
