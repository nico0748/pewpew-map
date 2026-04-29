import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'ddos')!;

const botPositions = [
  { x: 0.30, y: 0.10 },
  { x: 0.30, y: 0.30 },
  { x: 0.30, y: 0.50 },
  { x: 0.30, y: 0.70 },
  { x: 0.30, y: 0.90 },
  { x: 0.42, y: 0.20 },
  { x: 0.42, y: 0.55 },
  { x: 0.42, y: 0.85 }
];

export const ddos: AttackDefinition = {
  meta,
  caseStudy:
    '2016年 Mirai ボットネットが IoT 機器を踏み台に DNS 事業者 Dyn を停止させ、Twitter / Netflix / GitHub など主要サービスが米国東部で広範囲にアクセス不能となった。',
  damage: [
    { head: 'サービス停止:', body: 'ECサイトの注文・行政手続き・金融取引などが受付不能に。' },
    { head: '機会損失/信頼失墜:', body: '長時間の停止はブランド毀損につながる。' },
    { head: '帯域コスト増大:', body: 'クラウドの転送量課金が攻撃で跳ね上がる。' },
    { head: '陽動攻撃:', body: 'DDoSで監視を麻痺させ、別の侵入を行う事例もある。' }
  ],
  defense: [
    { head: 'CDN/Anti-DDoSサービス:', body: 'Cloudflare/AWS Shield 等で吸収・遮断。' },
    { head: 'レートリミット:', body: 'IP/ASN/UAごとにアプリ側で上限を設ける。' },
    { head: 'Anycast構成:', body: '複数地点に分散させ単一拠点で受けない。' },
    { head: 'オートスケール+回路遮断:', body: '増えた負荷を逃しつつ重要機能を保護。' },
    { head: 'BCPと連絡体制:', body: 'ISPやCSIRTへのエスカレーション手順を事前準備。' }
  ],
  devNote: [
    { head: 'タイムアウトを必ず設定:', body: 'DBや外部API呼び出しのタイムアウトが無いと、Slow系DDoSで全枠が埋まる。' },
    { head: '冪等性とリトライ制御:', body: 'クライアント側のリトライ嵐がDDoSと同等の負荷を生む。' },
    { head: '重い処理は非同期化:', body: '同期で処理し続けるエンドポイントは攻撃の好標的。' },
    { head: 'キャッシュ戦略:', body: '同一URL大量アクセスはキャッシュで吸収。Cache-Controlヘッダ確認。' },
    { head: 'ログとメトリクス:', body: '攻撃の早期検知のため p99 レイテンシと 4xx/5xx の急増監視は必須。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5 }, label: '攻撃者' });
    botPositions.forEach((p, i) => {
      stage.addActor(`bot${i}`, { pict: 'bot', pos: p, label: i === 0 ? 'ボットネット' : undefined });
    });
    stage.addActor('target', { pict: 'server', pos: { x: 0.85, y: 0.5 }, label: '標的サーバ' });
  },
  steps: [
    {
      title: 'C&Cがボットへ攻撃指令',
      description: '攻撃者がC&Cサーバ経由で多数のボットに対して一斉攻撃の指令を送る。',
      run: (stage) => {
        botPositions.forEach((_, i) => {
          stage.sendPacket('attacker', `bot${i}`, { duration: 900, className: 'benign', payload: 'ATTACK' });
        });
      }
    },
    {
      title: '一斉にリクエスト送信開始',
      description: 'すべてのボットが標的サーバへ同時多発的にリクエストを送り始める。',
      run: (stage) => {
        for (let wave = 0; wave < 3; wave++) {
          stage.after(wave * 400, () => {
            botPositions.forEach((_, i) => {
              stage.after(Math.random() * 200, () => stage.sendPacket(`bot${i}`, 'target', { duration: 800 }));
            });
          });
        }
      }
    },
    {
      title: 'サーバが過負荷で揺れ始める',
      description: '処理能力を超えるリクエストが届き、サーバの応答が遅延し始める。',
      run: (stage) => {
        stage.flashActor('target', 'shake', 2000);
        for (let wave = 0; wave < 3; wave++) {
          stage.after(wave * 400, () => {
            botPositions.forEach((_, i) => {
              stage.after(Math.random() * 200, () => stage.sendPacket(`bot${i}`, 'target', { duration: 800 }));
            });
          });
        }
      }
    },
    {
      title: 'サービス停止',
      description: '正規ユーザの応答も処理できなくなり、サービスが事実上停止する。',
      run: (stage) => {
        stage.setActorPict('target', 'warning', '標的サーバ(停止)');
      }
    }
  ]
};
