import { Stage, sequence } from '../../assets/js/animator.js';
import { renderAttackPage } from '../../assets/js/page.js';

const stage = new Stage('#stage');

// 攻撃者(Cmd&Ctrl) と6台のボット、標的サーバを配置
stage.addActor('attacker', 'attacker', { x: 0.05, y: 0.5 }, '攻撃者');
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
botPositions.forEach((p, i) => stage.addActor(`bot${i}`, 'bot', p, i === 0 ? 'ボットネット' : ''));
stage.addActor('target', 'server', { x: 0.85, y: 0.5 }, '標的サーバ');

renderAttackPage({
  title: 'DDoS攻撃',
  titleEn: 'Distributed Denial of Service',
  caseStudy: '2016年 Mirai ボットネットが IoT 機器を踏み台に DNS 事業者 Dyn を停止させ、Twitter / Netflix / GitHub など主要サービスが米国東部で広範囲にアクセス不能となった。',
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
    { head: '冪等性とリトライ制御:', body: 'クライアント側のリトライ嵐がDDoSと同等の負荷を生むことがある。' },
    { head: '重い処理は非同期化:', body: '同期で処理し続けるエンドポイントは攻撃の好標的。' },
    { head: 'キャッシュ戦略:', body: '同一URL大量アクセスはキャッシュで吸収。Cache-Controlヘッダ確認。' },
    { head: 'ログとメトリクス:', body: '攻撃の早期検知のため p99 レイテンシと 4xx/5xx の急増監視は必須。' }
  ]
});

document.getElementById('play').addEventListener('click', play);
document.getElementById('reset').addEventListener('click', () => { stage.reset(); stage.status('準備完了'); });

function play() {
  stage.reset();
  stage.status('攻撃シナリオ再生中…');

  // 1) C&Cがボットへ命令
  sequence([
    { delay: 0, run: () => {
      stage.status('C&C → ボットへ攻撃指令');
      botPositions.forEach((_, i) => {
        stage.sendPacket('attacker', `bot${i}`, { duration: 600, className: 'benign', payload: 'ATTACK' });
      });
    }, hold: 800 }
  ]);

  // 2) 各ボットから標的へリクエストを連射
  for (let wave = 0; wave < 6; wave++) {
    const at = 800 + wave * 400;
    setTimeout(() => {
      botPositions.forEach((_, i) => {
        const delay = Math.random() * 200;
        setTimeout(() => stage.sendPacket(`bot${i}`, 'target', { duration: 700 }), delay);
      });
      if (wave === 2) stage.flashActor('target', 'shake', 2400);
      if (wave === 3) stage.status('標的サーバ過負荷 → 応答できなくなる');
      if (wave === 5) stage.setActorPict('target', 'warning', '標的サーバ(停止)');
    }, at);
  }

  setTimeout(() => stage.status('サービス停止: CDN/Anti-DDoS と適切なレートリミットで緩和'), 800 + 6 * 400 + 400);
}
