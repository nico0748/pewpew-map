import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'data-poisoning')!;

export const dataPoisoning: AttackDefinition = {
  meta,
  appliesIf: [
    { head: '自前でモデル学習・継続学習している:', body: 'クロール・購入・コントリビュートで集めたデータを学習に投入する全システムが対象。' },
    { head: '利用者の入力をフィードバックに使っている:', body: 'オンライン学習・RLHF データに含めている場合、毒の投入経路が常時開いている。' },
    { head: 'Hugging Face 等から事前学習モデルを使っている:', body: 'モデル本体に既にバックドアが残っていることがある。' },
    { head: '学習データの来歴・ハッシュを記録していない:', body: '汚染が判明したとき影響範囲を遡れない。' },
    { head: '評価セットを学習側と分離していない:', body: '汚染による劣化を継続検知できず、気付いた時には手遅れ。' }
  ],
  caseStudy:
    '2016年 Microsoft Tay がTwitterから学習中に荒らしの投稿を取り込み24時間以内に差別発言を出すようになり停止。学術的にも 2017年 Gu らの "BadNets" がCNNにバックドアを仕込めることを示し、画像分類で特定パッチが入ると誤分類するよう訓練できることが実証された。OWASP LLM03(Training Data Poisoning) として継続的に問題視されている。',
  damage: [
    { head: 'バックドア:', body: '特定トリガで誤った出力を出すよう仕込まれ、本番運用中に悪用される。' },
    { head: 'バイアス注入:', body: '特定属性に対する判定が偏るよう改変され、差別/誤判定を引き起こす。' },
    { head: '安全制約の劣化:', body: 'RLHF データに毒を混ぜるとモデルが特定指示で安全制約を外す。' },
    { head: '長期的な信頼失墜:', body: '気づかぬうちに学習が積み重なり、原因究明が困難。' }
  ],
  defense: [
    { head: 'データ来歴(provenance)の管理:', body: '学習に使うデータの取得元・取得日時・ハッシュを記録。' },
    { head: '異常サンプル検知:', body: '統計的外れ値検知 / 影響度関数(Influence Function)で疑わしい例を抽出。' },
    { head: 'ロバスト学習:', body: 'differential privacy / certified robustness など耐毒性学習手法を併用。' },
    { head: '評価セット隔離:', body: '評価データは攻撃者に触れない完全分離で運用。劣化を継続検知。' },
    { head: '人手レビュー:', body: 'クラウドソース データの抽出抜き取りレビューを定期実施。' }
  ],
  devNote: [
    { head: 'クロール学習の前提変更:', body: '"インターネット由来=信頼" は破綻している。フィルタ・ハッシュ管理・許可リストを前提に。' },
    { head: 'ファインチューニング元の検証:', body: 'Hugging Face 等から落としたモデルにバックドアが残る可能性。SHA / 来歴 / モデルカードを必須確認。' },
    { head: '推論時のテリトリ:', body: '本番推論前に既知トリガパターンでカナリアテストを実施。' },
    { head: 'データセットのバージョニング:', body: 'DVC / lakeFS 等で再現性を確保し、毒混入を後追いできるように。' },
    { head: 'プロンプトログ分析:', body: '特定キーワードで挙動が急変するクラスタを定期検出する仕組みを用意。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('public',   { pict: 'document', pos: { x: 0.28, y: 0.5  }, label: '公開データ/OSS' });
    stage.addActor('train',    { pict: 'server',   pos: { x: 0.55, y: 0.5  }, label: '学習基盤' });
    stage.addActor('model',    { pict: 'bot',      pos: { x: 0.80, y: 0.5  }, label: '学習済モデル' });
    stage.addActor('user',     { pict: 'user',     pos: { x: 0.50, y: 0.90 }, label: '一般利用者' });
  },
  steps: [
    {
      title: '攻撃者が毒入りサンプルを公開',
      description: '攻撃者が学習元になりそうなWeb/レポジトリ/フォーラム等に細工サンプルを撒いておく。',
      run: (stage) => {
        stage.sendPacket('attacker', 'public', { duration: 1100, payload: 'trigger付きサンプル' });
      }
    },
    {
      title: '学習データとして取り込まれる',
      description: 'クロール/購入/コントリビュート経由で学習基盤がそのデータを取り込む。',
      run: (stage) => {
        stage.sendPacket('public', 'train', { duration: 1100, className: 'benign', payload: 'import dataset' });
      }
    },
    {
      title: 'バックドア付きモデルが完成',
      description: 'モデルは平常時は普通だが、特定トリガに反応する隠し挙動を持ってしまう。',
      run: (stage) => {
        stage.flashActor('train', 'shake', 800);
        stage.sendPacket('train', 'model', { duration: 1000, payload: 'backdoor埋込' });
      }
    },
    {
      title: '通常利用には問題なく動く',
      description: '一般ユーザーへの応答は正常で、問題は外見上わからない。',
      run: (stage) => {
        stage.sendPacket('user', 'model', { duration: 900, className: 'benign', payload: '通常質問' });
        stage.after(900, () => stage.sendPacket('model', 'user', { duration: 900, className: 'benign', payload: '正常応答' }));
      }
    },
    {
      title: '攻撃者がトリガで誤動作を起こす',
      description: '特定トリガを投入すると、攻撃者の意図通りの誤分類・誤生成を引き起こせる。',
      run: (stage) => {
        stage.sendPacket('attacker', 'model', { duration: 1000, payload: 'trigger語' });
        stage.after(900, () => {
          stage.flashActor('model', 'shake', 1000);
          stage.sendPacket('model', 'attacker', { duration: 1000, payload: '誤動作出力' });
        });
      }
    }
  ],
  beginner: {
    summary:
      'AIの「学習用データ」にこっそり仕込みを入れて、特定の合言葉で勝手な判定や出力をするよう「教え込む」攻撃。',
    appliesIf: [
      { head: '自分でAIモデルを学習させている / 継続学習している:', body: 'Webから集めたデータや購入したデータを使って学習している場合、汚染を取り込む経路があります。' },
      { head: '利用者の入力やフィードバックを学習に使っている:', body: '「OK/NG」のような利用者の評価をモデルに反映している場合、それ自体が攻撃の入り口になります。' },
      { head: 'Hugging Face などから既存のAIモデルを取ってきて使っている:', body: 'もらってきた時点で、すでに裏口が仕込まれている可能性があります。' },
      { head: '学習データの「どこから・いつ取ったか」を記録していない:', body: '汚染が判明したときに、影響範囲を遡って特定できません。' },
      { head: '評価用データと学習用データを分離していない:', body: 'モデルの劣化を継続して検知できず、気付いた時には手遅れになります。' }
    ],
    caseStudy:
      '2016年、Microsoft の Tay という Twitter で会話して学習する AI が、荒らしの投稿を学習データとして取り込み、24時間以内に差別発言を出すようになって停止された事件がありました。学術的にも、画像のどこかに小さなマークが入っていると AI が誤分類するように教え込めることが示されており(BadNets)、AI を使うシステムにとって「学習データの汚染」は今も大きな脅威です。',
    damage: [
      {
        head: '隠しスイッチ(バックドア)を仕込まれる:',
        body: '普段は正常に動くのに、特定の合言葉や特定の絵が入った瞬間だけ意図的に間違える、という隠し動作を仕込まれます。'
      },
      {
        head: '判定にバイアスを混ぜられる:',
        body: '特定の属性に対して判定が偏るように改変され、差別や誤判定が起きます。'
      },
      {
        head: 'AIの安全制限が弱くなる:',
        body: '安全な答え方を教えるためのデータ(RLHF用)に毒を混ぜると、特定のキーワードで安全制限が外れるようになります。'
      },
      {
        head: '原因を特定するのが難しい:',
        body: '学習が積み重なって徐々に劣化するので、後から「いつ誰がやったか」を辿るのが大変です。'
      }
    ],
    defense: [
      {
        head: '学習データの「来歴」を記録:',
        body: '学習に使うデータが「どこから・いつ・どんな内容で」来たかを記録(プロベナンス管理)し、ハッシュ値で改変を検知できるようにします。'
      },
      {
        head: 'おかしなサンプルを自動検出:',
        body: '統計的にずれているサンプル(外れ値)や、モデルへの影響が異様に強いサンプルを自動検出するツール(影響度関数など)で、怪しいデータを除きます。'
      },
      {
        head: '汚染に強い学習方法を使う:',
        body: '差分プライバシー(Differential Privacy)や認証付きロバスト学習のような、毒に強い学習手法を併用します。'
      },
      {
        head: '評価データは完全に隔離:',
        body: '評価用のデータは攻撃者の手が届かないところに完全分離して、モデルの劣化を継続的に検知できるようにします。'
      },
      {
        head: '抜き取り人手レビュー:',
        body: 'クラウドで集めたデータは、ランダムに抜き取って人がチェックするレビュー作業を定期実施します。'
      }
    ],
    devNote: [
      {
        head: '「ネットのデータ=安全」は通用しない:',
        body: 'Webから無条件に学習データを集める発想を捨て、フィルタ・ハッシュ管理・許可リストを前提にします。'
      },
      {
        head: '配布されているモデルにも毒の可能性:',
        body: 'Hugging Face などから持ってきた既存モデルにバックドアが残っている可能性があります。SHA・来歴・モデルカードを必ず確認。'
      },
      {
        head: '本番投入前にカナリアテスト:',
        body: '既知の攻撃トリガパターンを使って、本番推論前にチェック(カナリアテスト)します。'
      },
      {
        head: 'データセットをバージョン管理:',
        body: 'DVC や lakeFS のようなツールでデータセットを版管理し、毒の混入を後追いできるようにします。'
      },
      {
        head: 'プロンプトログを定期分析:',
        body: '特定のキーワードで挙動が急変する利用者クラスタを定期的に検出する仕組みを用意します。'
      }
    ],
    steps: [
      {
        title: '攻撃者が「毒入りサンプル」をネットに撒く',
        description:
          '攻撃者が、学習元になりそうな Web ページや GitHub のリポジトリ・フォーラム投稿などに、細工したデータを撒いておきます。'
      },
      {
        title: '学習チームがそれを取り込んでしまう',
        description:
          'クロール(Webを自動巡回)で、または購入で、あるいはコントリビューションを通じて、毒入りサンプルが学習基盤に取り込まれます。'
      },
      {
        title: '学習が完了し、隠しスイッチ付きのAIが完成',
        description:
          '学習が終わると、平時は普通に動くが、特定のトリガ(キーワードや画像のマーク)に反応する隠し挙動を持つAIができあがります。'
      },
      {
        title: '通常利用は何も問題ないように見える',
        description:
          '一般ユーザの普段の質問には正常に応答するので、外見上は問題なく見えます。'
      },
      {
        title: '攻撃者がトリガを使って誤動作を引き出す',
        description:
          '攻撃者は仕込んだトリガを入力するだけで、意図通りの誤分類・誤生成を引き起こせます。学習データの来歴管理 + 異常検知 + バージョン管理で防ぎます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      public: '公開データ / オープンソース',
      train: '学習基盤',
      model: '学習済みのAIモデル',
      user: '一般利用者'
    }
  }
};
