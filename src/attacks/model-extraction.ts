import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'model-extraction')!;

export const modelExtraction: AttackDefinition = {
  meta,
  caseStudy:
    '2016年 Tramèr らの "Stealing Machine Learning Models via Prediction APIs" で、Amazon ML や BigML 等の予測APIを叩くだけで決定木/SVM/NN を高精度に複製可能と実証。 2023年以降は LLM に対しても、API応答を蒸留(distillation)することで競合モデルを作る "Imitation Attack" が研究され、生成AIの知財/差別化要素を脅かす攻撃面として注目されている。OWASP LLM10 (Model Theft)。',
  damage: [
    { head: '知財/差別化の喪失:', body: '何百万ドルもかけて学習したモデルが安価に複製される。' },
    { head: '安全制約の迂回:', body: '抽出した複製モデルにはガードレールが無く、危険利用に転用可能。' },
    { head: '料金収入の侵食:', body: '従量課金APIの利用者が複製モデルへ流出する。' },
    { head: '攻撃の踏み台化:', body: '抽出モデルでオフライン解析し、本物への adversarial / membership inference 攻撃を効率化される。' }
  ],
  defense: [
    { head: 'クエリ監視 + レートリミット:', body: 'API利用パターンの異常(同一空間を網羅するような入力)を検出し制限。' },
    { head: '出力制限:', body: 'logit/確率を返さずTop-k のみ。応答に微小ノイズを加え情報量を抑える。' },
    { head: '透かし(watermark):', body: 'モデル応答に検出可能な透かしを混ぜ、複製モデルの素性を後から証明できるようにする。' },
    { head: 'Differential Privacy:', body: '訓練段階での DP-SGD によりモデル抽出耐性を高める。' },
    { head: '料金/契約設計:', body: '過剰クエリへの料金倍率や契約条項で経済的に抑止。' }
  ],
  devNote: [
    { head: '"高速応答" 自体が攻撃面:', body: '応答が速く安定しているほど攻撃者の最適化も効率化する。コスト最適化と防御のトレードオフを意識。' },
    { head: 'レイテンシ揺らぎ:', body: '応答時間からも特徴抽出される。タイミングサイドチャネルも考慮。' },
    { head: 'API設計時の出力粒度:', body: '"信頼度スコア" "確率分布" を返す必要が本当にあるか再検討する。' },
    { head: '無料枠の制限:', body: '無料枠/トライアル経由の大量蒸留に注意。クレジット制やKYCの導入を検討。' },
    { head: 'クエリのクラスタリング検知:', body: '埋め込み空間で密に網羅するクエリ分布は異常 → リアルタイムで detected/throttled。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 }, label: '攻撃者' });
    stage.addActor('api',      { pict: 'server',   pos: { x: 0.40, y: 0.5 }, label: '本物API(課金)' });
    stage.addActor('records',  { pict: 'document', pos: { x: 0.65, y: 0.5 }, label: '応答ログ' });
    stage.addActor('clone',    { pict: 'bot',      pos: { x: 0.90, y: 0.5 }, label: '複製モデル' });
  },
  steps: [
    {
      title: '大量クエリで応答を収集',
      description: '攻撃者が網羅的なクエリを大量に投げ、入出力ペアを集める。',
      run: (stage) => {
        for (let i = 0; i < 6; i++) {
          stage.after(i * 250, () => stage.sendPacket('attacker', 'api', { duration: 600, payload: 'q' + (i + 1) }));
        }
        for (let i = 0; i < 6; i++) {
          stage.after(700 + i * 250, () => stage.sendPacket('api', 'records', { duration: 500, className: 'benign', payload: 'reply' }));
        }
      }
    },
    {
      title: '入出力ペアを蓄積',
      description: '取得した応答を整形してデータセット化する。',
      run: (stage) => {
        stage.flashActor('records', 'shake', 800);
      }
    },
    {
      title: '蒸留で複製モデルを学習',
      description: '集めたデータをラベルとして自分のモデルを訓練し、本物の挙動に近づける。',
      run: (stage) => {
        stage.sendPacket('records', 'clone', { duration: 1200, payload: 'distill train' });
      }
    },
    {
      title: '複製モデルが完成',
      description: 'コストの一部で同等動作のモデルを得てしまう。さらにガードレール無しで再配布される懸念がある。',
      run: (stage) => {
        stage.flashActor('clone', 'shake', 900);
        stage.sendPacket('clone', 'attacker', { duration: 1000, payload: 'API互換モデル' });
      }
    }
  ]
};
