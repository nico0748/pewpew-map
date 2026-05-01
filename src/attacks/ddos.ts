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
    stage.addGroup({ id: 'botnet', x: 0.22, y: 0.02, w: 0.32, h: 0.96, label: 'ボットネット', variant: 'attack' });
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
  ],
  beginner: {
    summary:
      '世界中の大量の機器から一斉にアクセスを送りつけて、サーバを処理しきれなくして止めてしまう攻撃。',
    caseStudy:
      '2016年、家庭用ルータや監視カメラなどのインターネット機器を大量に乗っ取って攻撃の手駒(ボットネット)に変えた Mirai 事件で、ある DNS(ドメイン名と住所を結びつける案内係)サービスが攻撃で止められ、Twitter / Netflix / GitHub など多くの有名サービスが米国で広範囲に繋がらなくなりました。',
    damage: [
      {
        head: 'サービスが止まる:',
        body: 'ECサイトでの注文・行政手続き・銀行取引などが全部受け付けられなくなります。'
      },
      {
        head: 'お客さんを失う/信用を失う:',
        body: '長時間の停止で「使えないサービス」と思われ、ブランドが傷つきます。'
      },
      {
        head: 'クラウド料金が爆発:',
        body: 'クラウドの「通信量に応じた料金」が攻撃で跳ね上がり、請求書ショックを食らいます。'
      },
      {
        head: '本命の侵入を隠す目くらまし:',
        body: 'DDoS で監視チームを混乱させている裏で、こっそり別の侵入を仕込まれることもあります。'
      }
    ],
    defense: [
      {
        head: '攻撃を吸収してくれるサービス(CDN/Anti-DDoS)を入れる:',
        body: 'Cloudflare や AWS Shield のような「巨大な配信網で攻撃を受け止めて、自社サーバには綺麗なアクセスだけ届ける」仕組みを使います。'
      },
      {
        head: '一定数を超えるアクセスを断る(レートリミット):',
        body: 'IP やネットワーク単位で「1秒に何回まで」と上限を決め、それを超えたら断る仕組みをアプリ側にも入れます。'
      },
      {
        head: '受け口を世界に分散(Anycast):',
        body: '同じアドレスを世界中の複数地点に配置(Anycast)して、攻撃を一拠点で受けないようにします。'
      },
      {
        head: '増えた負荷を逃しつつ重要機能だけ守る:',
        body: 'クラウドの自動スケール(負荷に応じてサーバ台数を増やす機能)と、混雑時に重い機能を一時停止する作り(サーキットブレーカー)を組み合わせます。'
      },
      {
        head: '事前に対応手順を決めておく:',
        body: '回線業者(ISP)や、セキュリティ対応チーム(CSIRT)へ連絡する手順を事前に整えておきます。'
      }
    ],
    devNote: [
      {
        head: '通信のタイムアウトを必ず設定:',
        body: 'DBや外部APIの呼び出しに「●秒で諦める」設定(タイムアウト)が無いと、わざと遅いリクエストで枠を全部塞がれて止まります(Slow系の攻撃)。'
      },
      {
        head: 'リトライを暴走させない:',
        body: 'クライアント側の「失敗したら即再試行」を制限なく許すと、それ自体が DDoS と同じ負荷になります。再試行間隔を徐々に伸ばす(指数バックオフ)などの制御を。'
      },
      {
        head: '重い処理は裏で動かす:',
        body: '画像変換やレポート生成のような重い処理は、リクエストを受けたあと裏側のジョブキューに流して、即座に返事を返すように。'
      },
      {
        head: 'キャッシュで吸収:',
        body: '同じURLに大量アクセスが来るなら、CDNやサーバ側のキャッシュで返せるようにします。`Cache-Control` ヘッダの設定を確認。'
      },
      {
        head: '異常を早く気付くための監視:',
        body: '応答時間の悪化(p99 レイテンシ)や、エラー(4xx/5xx)の急増を常時監視して、攻撃の兆候を早く検知できるようにします。'
      }
    ],
    steps: [
      {
        title: '攻撃者が乗っ取った大量の機器に「攻撃しろ」と命令',
        description:
          '攻撃者は、ウイルスで乗っ取ったたくさんの IoT 機器(ルータ・カメラなど)に「一斉に攻撃せよ」という命令を送ります。'
      },
      {
        title: '世界中から同時にアクセスが押し寄せる',
        description:
          '命令を受けた機器(ボット)が、揃って標的サーバへリクエストを送りつけ始めます。'
      },
      {
        title: 'サーバが処理しきれず重くなる',
        description:
          '処理できる量を超えたリクエストが押し寄せ、サーバが重くなり、応答がどんどん遅れていきます。'
      },
      {
        title: 'サービスが事実上停止',
        description:
          '正しい利用者のリクエストも処理できなくなり、サービスが繋がらなくなります。CDN/Anti-DDoS + レートリミット + 自動スケールの三段構えが効きます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      target: '標的サーバ'
    },
    groupLabels: {
      botnet: '乗っ取られた機器の集まり(ボットネット)'
    }
  }
};
