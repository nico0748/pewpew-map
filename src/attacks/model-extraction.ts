import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'model-extraction')!;

export const modelExtraction: AttackDefinition = {
  meta,
  appliesIf: [
    { head: '自前学習したMLモデルをAPIで提供している:', body: '高精度モデルが差別化要素のサービスはモデル盗用の標的。' },
    { head: 'API応答に確率分布/スコア(logit)を含む:', body: '攻撃者の蒸留学習を大幅に高速化させる情報。' },
    { head: 'レートリミット/クエリ監視が無い:', body: '網羅クエリを検知できないと容易に蒸留される。' },
    { head: '無料枠/トライアルで大量クエリ可能:', body: 'KYCや課金制限が無いと低コストで複製される。' },
    { head: '応答に透かし(watermark)が無い:', body: '複製モデルの素性を後追いで主張できない。' }
  ],
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
  ],
  beginner: {
    summary:
      'AIのAPIを大量に叩いて入出力を集め、その答えを真似する別のAIを学習することで「中身を盗む」攻撃。',
    appliesIf: [
      { head: '自分で学習したAIをAPIで公開している:', body: '高精度なモデルが差別化要素のサービスは、複製の標的になりやすい。' },
      { head: 'API応答で確率や信頼度スコアを返している:', body: '攻撃者の「真似学習」を大幅に楽にしてしまう情報を渡すことになります。' },
      { head: '同じ人が大量にAPIを叩いても止まらない仕組み:', body: '網羅的なクエリを検知してレート制限する仕組みがないと、容易に蒸留されます。' },
      { head: '無料枠やトライアルで大量にクエリを打てる:', body: '本人確認(KYC)や課金制限が無いと、低コストで複製されてしまいます。' },
      { head: '応答に「透かし」を仕込んでいない:', body: '複製モデルが出回ったときに、自社のモデルを基にしたと証明できなくなります。' }
    ],
    caseStudy:
      '2016年に「予測APIを叩くだけで決定木やSVMやニューラルネットワークが高精度に複製できる」という研究が発表されました。2023年以降は、ChatGPT のようなLLMに対しても、API応答を真似する形で類似モデルを作る攻撃(蒸留や Imitation Attack)が研究され、生成AIの知的財産が盗まれる脅威として注目されています。',
    damage: [
      {
        head: '何百万ドルもかけたモデルが安く複製される:',
        body: '本来は高い学習コストがかかったモデルが、API利用料程度のコストで似たものを再現されてしまいます。'
      },
      {
        head: '複製モデルには安全制限が無い:',
        body: '本物には付いている安全フィルタが、複製モデルには付いていないので、危険な使い方に転用される可能性があります。'
      },
      {
        head: '本物の収入が減る:',
        body: '本物のAPIを使っていたお客さんが、安い複製モデルへ流れてしまいます。'
      },
      {
        head: '次の攻撃の足場にされる:',
        body: '複製モデルを使ってオフラインで解析し、本物への敵対的サンプル攻撃や情報抽出攻撃を効率化されます。'
      }
    ],
    defense: [
      {
        head: '異常な利用パターンを検知 + レートリミット:',
        body: '網羅的に空間をなめるようなクエリ分布は不自然です。検知してレートを下げる仕組みを入れます。'
      },
      {
        head: '出力情報を絞る:',
        body: '生のスコアや確率分布を返さず、トップ K個だけにする。応答にわずかなノイズを混ぜて情報量を減らします。'
      },
      {
        head: '応答に「透かし(watermark)」を仕込む:',
        body: '応答に検出可能な透かしを混ぜておき、複製モデルが出回ったときに「うちのを基にしたものだ」と証明できるようにします。'
      },
      {
        head: '差分プライバシーを併用:',
        body: '訓練の段階で差分プライバシー(DP-SGD)を使うと、出力から元の挙動を真似しにくくなります。'
      },
      {
        head: '契約・料金で抑止:',
        body: '過剰なクエリには料金が跳ね上がる仕組みや、利用契約での明示禁止条項などで経済的に抑止します。'
      }
    ],
    devNote: [
      {
        head: '高速・安定が攻撃を助ける:',
        body: 'APIの応答が速く・安定しているほど、攻撃者にとっては学習が楽になります。コスト最適化と防御のトレードオフを意識しましょう。'
      },
      {
        head: 'レスポンスタイムも情報源:',
        body: '応答時間の差から内部処理を推測される(タイミングサイドチャネル)こともあります。'
      },
      {
        head: '出力粒度を見直す:',
        body: 'API設計時に「信頼度スコア」「確率分布」を返す必要が本当にあるか再検討します。'
      },
      {
        head: '無料枠を絞る:',
        body: '無料枠やトライアル経由で大量に蒸留される事例があります。クレジット制や本人確認(KYC)の導入を検討。'
      },
      {
        head: 'クエリ分布の異常検知:',
        body: '埋め込み空間で密に網羅するようなクエリ分布は異常と判定して、リアルタイムで制限します。'
      }
    ],
    steps: [
      {
        title: '攻撃者が大量にAPIを叩く',
        description:
          '攻撃者がAIのAPIに対して、網羅的なクエリを大量に送り、入出力ペアを集めていきます。'
      },
      {
        title: '応答ペアをデータセットに蓄積',
        description:
          '集めた入出力ペアを整理して、複製モデル用の学習データセットに整形します。'
      },
      {
        title: '蒸留で複製モデルを学習',
        description:
          '蓄積したペアを「正解」として使い、自分のモデルに本物の応答を真似るよう学習させます(蒸留)。'
      },
      {
        title: '本物そっくりの複製モデルが手元に',
        description:
          '本物の学習コストの何十分の一で、本物に近い動きをするモデルが手に入ってしまいます。さらに安全フィルタなしで配布されかねません。出力情報の絞り + クエリ監視 + 透かしで対抗します。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      api: '本物のAPI(有料)',
      records: '応答を蓄積したログ',
      clone: '複製モデル'
    }
  }
};
