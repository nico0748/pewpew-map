import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'adversarial-examples')!;

export const adversarialExamples: AttackDefinition = {
  meta,
  caseStudy:
    '2014年 Goodfellow らの "Explaining and Harnessing Adversarial Examples" で、人間にはほぼ同じに見える画像でCNNが「パンダ→テナガザル」と誤分類する例が示された。 2018年 Eykholt らはステッカーを貼った道路標識を物理空間で誤認識させる "Robust Physical-World Attacks" を実証。マルウェア検知器・スパムフィルタ・不正検知などのセキュリティモデルへの影響も継続研究されている。',
  damage: [
    { head: '誤分類による意思決定誤り:', body: '自動運転で標識を見落とす、検知器がマルウェアを通すなど致命的判断ミス。' },
    { head: '検知回避:', body: 'スパム・不正・ボット検知をすり抜けるよう入力を最適化される。' },
    { head: '生体認証回避:', body: '顔認証や音声認識を欺きなりすましを成立させる。' },
    { head: 'モデル信頼性の毀損:', body: '少数の例で誤動作を引き起こせるため、AI判断の社会的信頼性が揺らぐ。' }
  ],
  defense: [
    { head: 'Adversarial Training:', body: '攻撃用サンプルを混ぜて再学習し、ロバスト性を獲得する。' },
    { head: '入力前処理:', body: 'JPEG圧縮 / ノイズ除去 / 量子化など、摂動を打ち消す加工を入れる。' },
    { head: 'アンサンブル/不確実性評価:', body: '複数モデル合議や Bayesian 不確実性で異常入力を弾く。' },
    { head: '入力範囲の制限:', body: '画像なら撮影条件、テキストなら文字種に制約をかけ攻撃面を縮小。' },
    { head: 'モニタリング:', body: '実運用で予測信頼度の異常変化を継続監視。' }
  ],
  devNote: [
    { head: '"99%精度" は安全性の指標ではない:', body: '通常評価セットの精度と敵対環境下のロバスト性は別物。両指標を持つ。' },
    { head: 'モデルの非ブラックボックス化を避ける:', body: '生スコア(logits)をAPIで返すと攻撃者の最適化が容易になる。Top-1ラベルやしきい値ありに留める。' },
    { head: '物理世界の攻撃を想定:', body: 'カメラ系AIではステッカー/印刷物による攻撃も想定。実機評価を行う。' },
    { head: 'NLP系の場合:', body: '同義語置換・誤字混入・unicode類似文字でも誤分類が起きる。トークナイザ前後の正規化を徹底。' },
    { head: '監視ログの改ざん耐性:', body: '攻撃ログを保存しないモデルAPIは挙動分析ができない。クエリと応答の構造化ログを確保。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5  }, label: '攻撃者' });
    stage.addActor('orig',     { pict: 'document', pos: { x: 0.32, y: 0.20 }, label: '元データ' });
    stage.addActor('adv',      { pict: 'document', pos: { x: 0.32, y: 0.80 }, label: '敵対的サンプル' });
    stage.addActor('model',    { pict: 'bot',      pos: { x: 0.62, y: 0.5  }, label: '判定モデル' });
    stage.addActor('correct',  { pict: 'shield',   pos: { x: 0.88, y: 0.20 }, label: '正常判定' });
    stage.addActor('wrong',    { pict: 'warning',  pos: { x: 0.88, y: 0.80 }, label: '誤判定' });
  },
  steps: [
    {
      title: '元データはモデルに正しく分類される',
      description: '通常の入力に対しては、モデルは適切なクラスを返す。',
      run: (stage) => {
        stage.sendPacket('orig', 'model', { duration: 1000, className: 'benign', payload: '画像 (panda)' });
        stage.after(900, () => stage.sendPacket('model', 'correct', { duration: 900, className: 'benign', payload: 'panda ✓' }));
      }
    },
    {
      title: '攻撃者が微小摂動を加える',
      description: '人間にはほぼ同じに見える程度のノイズ(摂動)を最適化により付与する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'adv', { duration: 1100, payload: '+ε勾配ノイズ' });
        stage.after(900, () => stage.flashActor('adv', 'shake', 700));
      }
    },
    {
      title: '敵対的サンプルをモデルへ投入',
      description: '見た目はほぼ同じ入力をモデルに送る。',
      run: (stage) => {
        stage.sendPacket('adv', 'model', { duration: 1000, payload: '画像 (panda+ε)' });
      }
    },
    {
      title: 'モデルが別のクラスに誤分類',
      description: 'モデルはまったく違うクラスを返してしまう。Adversarial Training + 入力前処理で耐性向上。',
      run: (stage) => {
        stage.flashActor('model', 'shake', 800);
        stage.sendPacket('model', 'wrong', { duration: 1100, payload: 'gibbon ✗' });
      }
    }
  ]
};
