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
  ]
};
