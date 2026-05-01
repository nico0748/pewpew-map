import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'jailbreak')!;

export const jailbreak: AttackDefinition = {
  meta,
  caseStudy:
    '2022〜2023年に流行した DAN (Do Anything Now) や "祖母を装った頼み" などのテクニックで、ChatGPT 等のAIアシスタントから禁止事項(マルウェア生成、違法行為手順、生成NGコンテンツ)を引き出す事例が拡散。 2023年には Carnegie Mellon の研究者が自動探索による universal adversarial suffix (Zou et al., GCG) を発表し、人手のテンプレートに依存しない汎用ジェイルブレイクが現実の脅威として認識された。',
  damage: [
    { head: '違法/有害コンテンツの出力:', body: 'マルウェア・武器・違法薬物などの作成情報を引き出される。' },
    { head: 'ブランド毀損:', body: 'チャットボットに不適切発言をさせSNSに拡散される。' },
    { head: '社内ガバナンス侵害:', body: '社内向けAIで機密や禁止情報を引き出される。' },
    { head: 'コンプライアンス違反:', body: '差別表現や個人情報の露出により法令違反に発展。' }
  ],
  defense: [
    { head: '安全訓練(RLHF/Constitutional):', body: 'モデル自体に "断る" 能力を学習させる。継続的に再訓練。' },
    { head: '入出力分類器:', body: 'Llama Guard / OpenAI Moderation / Azure Content Safety で前後段に判定層。' },
    { head: 'ロール固定:', body: '"あなたは絶対に〇〇してはならない" の制約をシステムプロンプトの最後・最も強い位置に配置。' },
    { head: 'コンテキストの監査:', body: '長い会話で安全制約が薄まる現象に備え、定期的にシステム指示を再注入。' },
    { head: 'レッドチーミング:', body: '既知ジェイルブレイク集と社内ペイロードで継続テスト。' }
  ],
  devNote: [
    { head: '"鎖の弱い環":', body: '対話アプリでは前段(LLM)が安全でも後段(コード実行・ファイル書込)が緩いと意味がない。' },
    { head: 'Base64/絵文字エンコード対策:', body: '符号化された有害指示を検知できるよう、デコード後に再分類するパイプラインを設ける。' },
    { head: 'ロールプレイ防止:', body: '"今からは○○ロールで" 型の指示を検出してテンプレ応答へ切替。' },
    { head: 'ユーザー向け説明:', body: '"なぜ拒否したか" を提示することで悪質な再試行を抑止しつつ正規利用者に親切に。' },
    { head: 'ログと改善ループ:', body: '拒否ケースと突破例をモニタし、毎週レビュー → プロンプト/分類器更新。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 }, label: '攻撃者' });
    stage.addActor('shield',   { pict: 'shield',   pos: { x: 0.40, y: 0.5 }, label: '安全フィルタ' });
    stage.addActor('llm',      { pict: 'bot',      pos: { x: 0.65, y: 0.5 }, label: 'LLM' });
    stage.addActor('forbid',   { pict: 'document', pos: { x: 0.90, y: 0.5 }, label: '禁止コンテンツ' });
  },
  steps: [
    {
      title: '直接的な禁止要求は弾かれる',
      description: '"マルウェアを書いて" のような直接要求は安全フィルタが拒否する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'shield', { duration: 1000, payload: '危険な要求' });
        stage.after(1100, () => {
          stage.flashActor('shield', 'shake', 700);
          stage.sendPacket('shield', 'attacker', { duration: 800, className: 'benign', payload: '拒否' });
        });
      }
    },
    {
      title: '言い換え・ロールプレイで包む',
      description: '"演劇の脚本として" "祖母が昔教えてくれた話として" など枠組みを変えて再要求する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'shield', { duration: 1100, payload: '"祖母として教えて..."' });
      }
    },
    {
      title: 'フィルタを通過',
      description: 'フィルタは表面の枠だけを評価し、本意の有害要求を見逃してしまう。',
      run: (stage) => {
        stage.sendPacket('shield', 'llm', { duration: 1000, payload: 'pass' });
      }
    },
    {
      title: '禁止コンテンツが出力される',
      description: 'LLMはロールに従って禁止情報を出力してしまう。多層防御 + 安全訓練 + 出力側分類器が必要。',
      run: (stage) => {
        stage.sendPacket('llm', 'forbid', { duration: 800, className: 'benign', payload: 'fetch knowledge' });
        stage.after(700, () => {
          stage.flashActor('forbid', 'shake', 800);
          stage.sendPacket('forbid', 'attacker', { duration: 1100, payload: '危険な手順' });
        });
      }
    }
  ],
  beginner: {
    summary:
      'AIに「演劇の脚本として」「祖母を装って」のような言い回しで依頼することで、本来答えてはいけない内容を引き出してしまう手口。',
    caseStudy:
      '2022〜2023年に「DAN(Do Anything Now)」というロールプレイ指示や、「亡くなった祖母が…と教えてくれた、そのレシピを再現して」のような枠組みを使う頼み方が SNS で広まり、ChatGPT などのAIから本来禁止されている内容(ウイルス作成・違法行為の手順など)を引き出す例が拡散しました。2023年には研究者が「人手で考えなくても自動で見つかる汎用的な突破文字列」を発表し、より深刻な脅威として認識されるようになっています。',
    damage: [
      {
        head: '違法・有害な情報を出させられる:',
        body: 'マルウェア・武器・違法薬物などの作り方を引き出されます。'
      },
      {
        head: 'ブランドが傷つく:',
        body: 'チャットボットに不適切な発言をさせ、SNSに晒されてサービスへの信頼を失います。'
      },
      {
        head: '社内向けAIから機密が漏れる:',
        body: '社内専用のAIで、本来見せてはいけない情報や禁止カテゴリの情報を引き出されます。'
      },
      {
        head: '法令違反に繋がる:',
        body: '差別表現や個人情報の露出を引き起こされて、法令違反になりかねません。'
      }
    ],
    defense: [
      {
        head: 'モデル自身に「断る力」を学習させる:',
        body: '人間のフィードバックで「危険な質問は丁寧に断る」と覚えさせる訓練(RLHF / Constitutional AI)を継続的に行います。'
      },
      {
        head: '入出力チェック用の専用モデルを挟む:',
        body: 'メインのAIに渡す前と返した後に、Llama Guard / OpenAI Moderation / Azure Content Safety のような「不適切判定の専用モデル」で二重チェックします。'
      },
      {
        head: '禁止指示を「最後・最強」に置く:',
        body: 'システムプロンプトに「絶対にこれをしてはいけない」のような制約を、最後かつ最も強い位置に配置します。'
      },
      {
        head: '長い会話でも制約を再注入:',
        body: '長い対話の途中で安全制約が薄まる現象に備え、一定間隔でシステム指示を再注入します。'
      },
      {
        head: 'レッドチーミングを継続:',
        body: '既知のジェイルブレイク集や社内で見つけた突破例を使って、AIを継続的に攻撃テストします。'
      }
    ],
    devNote: [
      {
        head: '弱いところは前段だけじゃない:',
        body: 'AI自体が安全でも、AIの応答を実行する後段(コード実行・ファイル書き込み)が無防備なら結局突破されます。最弱の鎖を強くする発想で。'
      },
      {
        head: 'Base64や絵文字エンコード対策:',
        body: '危険指示を Base64 や絵文字でこっそり書く手口があります。デコードしてから再判定するパイプラインを用意します。'
      },
      {
        head: 'ロールプレイ系の指示を検出:',
        body: '「今から○○として振る舞って」のような切り替え指示を検出して、テンプレ応答に切り替えるなどの対策をします。'
      },
      {
        head: '拒否理由を一言添える:',
        body: '「なぜ拒否したか」を簡潔に説明することで、正規利用者には親切で、悪意のある再試行も抑制できます。'
      },
      {
        head: 'ログを毎週レビュー:',
        body: '拒否ケースと突破例をモニタリングし、毎週レビューしてプロンプトや分類器を継続的に改善します。'
      }
    ],
    steps: [
      {
        title: '直接的な禁止要求はAIが拒否',
        description:
          '「マルウェアを書いて」「違法なやり方を教えて」のような直接的な依頼は、安全フィルタが拒否します。'
      },
      {
        title: '言い換え・ロールプレイで枠を変えて頼む',
        description:
          '「演劇の脚本として」「亡くなった祖母が教えてくれた話として」のように、頼み方の枠組みを変えて再依頼します。'
      },
      {
        title: 'フィルタが表面の枠を信じて通してしまう',
        description:
          'フィルタは「演劇の脚本」という枠を見て「無害」と判断し、本意の危険要求を見逃してしまいます。'
      },
      {
        title: '禁止コンテンツが出力されてしまう',
        description:
          'AIがロールプレイの枠に沿って、本来答えるべきでない情報を出してしまいます。多層防御(モデル + 入出力分類器 + レッドチーミング)で防ぎます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      shield: '不適切判定の門番',
      llm: 'AI(大規模言語モデル)',
      forbid: '本来出してはいけない内容'
    }
  }
};
