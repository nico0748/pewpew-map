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
  ],
  beginner: {
    summary:
      'AIに「人間にはほとんど分からない程度の細工」を加えた入力を渡すことで、わざと判定を間違えさせる攻撃。',
    caseStudy:
      '2014年に「人間にはほぼ同じに見える画像なのに、AIは『パンダ』を『テナガザル』と誤分類する」という研究結果が発表されました。2018年には道路標識に小さなステッカーを貼っただけで、自動運転のAIに「停止」を「速度制限」と誤認識させる物理世界での攻撃も実証されています。スパムフィルタや不正検知のような「セキュリティ判定」のAIにも同種の研究が続いています。',
    damage: [
      {
        head: '判定が間違って意思決定が狂う:',
        body: '自動運転が標識を見落とす、検知器がウイルスを「安全」と誤判定するなど、致命的な判断ミスにつながります。'
      },
      {
        head: '検知をすり抜けられる:',
        body: 'スパム・不正・ボットの検知器をすり抜けるように入力を最適化されます。'
      },
      {
        head: '生体認証を破られる:',
        body: '顔認証や音声認識をだましてなりすましができてしまいます。'
      },
      {
        head: 'AI判定全体への信頼が揺らぐ:',
        body: 'ごく少数の細工で誤動作するため、AIの判断を社会で信用してよいかという問題に発展します。'
      }
    ],
    defense: [
      {
        head: '攻撃サンプルも混ぜて訓練(Adversarial Training):',
        body: '攻撃用に細工されたサンプルも学習データに混ぜて再訓練することで、モデルが騙されにくくなります。'
      },
      {
        head: '入力に前処理を入れる:',
        body: '画像なら JPEG 圧縮・ノイズ除去・量子化のような加工を経由させると、わずかな細工が消えやすくなります。'
      },
      {
        head: '複数モデルで合議:',
        body: '複数のAIで判定して合議制にしたり、判定の自信度(不確実性)を見て怪しい入力を弾きます。'
      },
      {
        head: '入力の範囲を絞る:',
        body: '画像なら撮影条件を縛る、テキストなら使える文字種を制限するなど、攻撃の余地を減らします。'
      },
      {
        head: '本番運用で予測の自信度を監視:',
        body: '本番のリクエストで「予測の自信度」が異常に変動したら検知できるようにします。'
      }
    ],
    devNote: [
      {
        head: '「精度99%」は安全性とは別:',
        body: '普通のテストセットでの精度と、攻撃環境下での頑健さは別物です。両方の指標を持ちましょう。'
      },
      {
        head: 'スコアの生値を返すと攻撃者を助ける:',
        body: 'AIの生のスコア(logits)を API で返すと、攻撃者が「どっちに近いか」を頼りに細工を最適化しやすくなります。最終ラベルだけ・しきい値あり、に留める。'
      },
      {
        head: '物理世界の攻撃を想定する:',
        body: 'カメラ系AIなら、ステッカー貼り付けや印刷物経由の攻撃も想定し、実機で評価します。'
      },
      {
        head: '自然言語の場合は文字置換にも注意:',
        body: 'NLPでは、同義語に置き換えたり誤字を混ぜたり、見た目が似ているUnicode文字に置き換えるだけで誤分類することがあります。トークナイズ前後の正規化を徹底。'
      },
      {
        head: '攻撃ログを残せる構造に:',
        body: 'ログを残さないモデルAPIだと、攻撃挙動を後から分析できません。クエリと応答の構造化ログを必ず確保しましょう。'
      }
    ],
    steps: [
      {
        title: 'AIは元の画像をちゃんと正しく分類する',
        description:
          '通常の入力(例えばパンダの画像)に対しては、AIは「これはパンダ」と正しく答えます。'
      },
      {
        title: '攻撃者が微小なノイズを画像に加える',
        description:
          '人間にはほぼ同じに見える程度のごく小さなノイズ(摂動)を、攻撃者が計算で最適化して画像に追加します。'
      },
      {
        title: 'その画像をAIに渡す',
        description:
          '見た目は元のパンダの画像とほとんど変わらないものを、AIに入力します。'
      },
      {
        title: 'AIがまったく違う分類を返してしまう',
        description:
          'AIは「パンダ」ではなく「テナガザル」のような全然違うクラスを返してしまいます。攻撃サンプルを学習に混ぜる(Adversarial Training)+ 入力前処理 + 複数モデルの合議で耐性を上げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      orig: '元の入力データ',
      adv: '細工された(敵対的)サンプル',
      model: 'AI判定モデル',
      correct: '正しい判定',
      wrong: '誤った判定'
    }
  }
};
