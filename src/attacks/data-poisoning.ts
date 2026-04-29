import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'data-poisoning')!;

export const dataPoisoning: AttackDefinition = {
  meta,
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
  ]
};
