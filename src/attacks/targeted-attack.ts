import type { AttackDefinition } from '../types';
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
    stage.addGroup({ x: 0.36, y: 0.04, w: 0.42, h: 0.92, label: '対象組織', variant: 'victim' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: 'APTグループ' });
    stage.addActor('mail',     { pict: 'email',    pos: { x: 0.25, y: 0.5  }, label: '標的型メール' });
    stage.addActor('employee', { pict: 'user',     pos: { x: 0.45, y: 0.5  }, label: '従業員' });
    stage.addActor('endpoint', { pict: 'browser',  pos: { x: 0.65, y: 0.20 }, label: '感染端末' });
    stage.addActor('ad',       { pict: 'server',   pos: { x: 0.65, y: 0.80 }, label: '社内AD/ファイルサーバ' });
    stage.addActor('exfil',    { pict: 'document', pos: { x: 0.90, y: 0.5  }, label: '機密データ' });
    stage.addConnection('endpoint', 'ad', { variant: 'aux', dashed: true });
    stage.addConnection('ad', 'exfil', { variant: 'aux', dashed: true });
  },
  steps: [
    {
      title: '業務に偽装した標的型メール',
      description: '攻撃者が、相手組織に詳しい内容で書かれた業務文書を装ったメールを送付する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'mail', { duration: 1000, payload: '請求書.docx (マクロ付)' });
      }
    },
    {
      title: '従業員に届く',
      description: '一見正規の取引先や社内連絡に見えるため、開かれてしまうことが多い。',
      run: (stage) => {
        stage.sendPacket('mail', 'employee', { duration: 1000, payload: '"確認お願いします"' });
      }
    },
    {
      title: '添付ファイル開封 → 端末感染',
      description: 'マクロ付きDocやリンクから不正実行が起き、端末がマルウェアに感染する。',
      run: (stage) => {
        stage.sendPacket('employee', 'endpoint', { duration: 1000, className: 'benign', payload: '開封' });
        stage.after(900, () => stage.flashActor('endpoint', 'shake', 1000));
      }
    },
    {
      title: '長期潜伏 → 横展開',
      description: 'すぐには活動を始めず、認証情報を集めながら社内サーバ/ADへ侵入を広げる。',
      run: (stage) => {
        stage.sendPacket('endpoint', 'ad', { duration: 1300, payload: 'lateral movement' });
      }
    },
    {
      title: '機密データを集約',
      description: 'AD・ファイルサーバから組織の機密情報を整理・集約する。',
      run: (stage) => {
        stage.flashActor('ad', 'shake', 800);
        stage.sendPacket('ad', 'exfil', { duration: 1000, className: 'benign', payload: 'collect' });
      }
    },
    {
      title: '暗号化して外部送信',
      description: '通信を正常な業務通信に紛れ込ませる形で暗号化してC&Cへ送信する。',
      run: (stage) => {
        stage.sendPacket('exfil', 'attacker', { duration: 1300, payload: 'encrypted exfil' });
      }
    }
  ]
};
