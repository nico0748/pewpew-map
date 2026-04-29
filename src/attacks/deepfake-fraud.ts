import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'deepfake-fraud')!;

export const deepfakeFraud: AttackDefinition = {
  meta,
  caseStudy:
    '2024年初頭、香港の多国籍企業の財務担当が、AI生成のディープフェイク映像でCFOや同僚になりすました複数人参加のWeb会議に騙され、約2,500万米ドルを送金した事件が報じられた。 2019年には英国エネルギー会社で経営者の音声をAIで合成した電話により22万ユーロが詐取される事案。AI音声合成・映像合成の発達により、社外との一般的な認証手続き(電話・Web会議)が信頼基盤として揺らいでいる。',
  damage: [
    { head: '高額不正送金:', body: 'CFO/CEO になりすまされ、規定外の即時送金を承認させられる。' },
    { head: 'MFA承認の誘導:', body: 'IT管理者を装った電話で被害者にMFA承認を急かさせる。' },
    { head: '評判被害:', body: '経営層名義の偽動画がSNSで拡散され株価/信頼に影響。' },
    { head: '訴訟リスク:', body: '本人になりすましの発言で取引先や顧客との契約に紛争が発生。' }
  ],
  defense: [
    { head: 'コールバック検証:', body: '電話/会議で送金等を要求されたら、登録済の番号にかけ直して本人確認するルールを徹底。' },
    { head: '合言葉/家族コード:', body: '社内外の重要承認には事前共有の確認語句を運用に組み込む。' },
    { head: '送金プロセスの多人数承認:', body: '"1人の口頭指示で送金完了" を設計から排除。書面+複数承認に。' },
    { head: 'AI検知ツール:', body: '映像/音声のディープフェイク判定機能を会議システム/コールセンタに組み込む。' },
    { head: '社員教育:', body: '"経営者からの緊急依頼" は特に疑え、というシナリオで継続訓練を行う。' }
  ],
  devNote: [
    { head: 'チャット/会議ツール側のID:', body: 'Microsoft Teams / Zoom 等の "認証済発信者" バッジに依存しすぎない。アカウント乗っ取りもありうる。' },
    { head: '"動画あり=本物" は過信:', body: 'リアルタイム合成の精度が上がり、画像と音声が揃っていても証明にはならない。' },
    { head: 'ボイスプリント認証:', body: '声紋を本人認証に使うシステムは合成音声でなりすませるリスクが高まっており、見直し対象。' },
    { head: '請求書/振込先の検証:', body: '振込先口座は変更フローを別経路で検証(BEC全般の対策と共通)。' },
    { head: 'ログとAuditレポート:', body: '送金やID変更などの重要操作は録画・録音込みでログを残し、事後追跡可能にする。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('voice',    { pict: 'bot',      pos: { x: 0.25, y: 0.20 }, label: 'AI音声合成' });
    stage.addActor('video',    { pict: 'bot',      pos: { x: 0.25, y: 0.80 }, label: 'AI映像合成' });
    stage.addActor('meet',     { pict: 'browser',  pos: { x: 0.50, y: 0.5  }, label: 'Web会議' });
    stage.addActor('finance',  { pict: 'user',     pos: { x: 0.75, y: 0.5  }, label: '財務担当' });
    stage.addActor('bank',     { pict: 'server',   pos: { x: 0.95, y: 0.5  }, label: '銀行' });
  },
  steps: [
    {
      title: '攻撃者がCFO/CEOの音声・映像をAI生成',
      description: 'SNSや過去の登壇映像から学習した音声/映像合成で経営層になりすますコンテンツを準備する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'voice', { duration: 1000, payload: 'voice clone' });
        stage.sendPacket('attacker', 'video', { duration: 1000, payload: 'face swap' });
      }
    },
    {
      title: 'Web会議で経営層を装って参加',
      description: '財務担当を巻き込んだ "緊急の会議" を開き、本物そっくりに振る舞う。',
      run: (stage) => {
        stage.sendPacket('voice', 'meet', { duration: 900, payload: '合成音声' });
        stage.sendPacket('video', 'meet', { duration: 900, payload: '合成映像' });
        stage.after(900, () => stage.flashActor('meet', 'shake', 800));
      }
    },
    {
      title: '"緊急送金" を直接依頼',
      description: '会議の場で "今すぐ機密案件として送金を" と圧力をかけ、財務担当に決裁を促す。',
      run: (stage) => {
        stage.sendPacket('meet', 'finance', { duration: 1000, payload: '"今すぐ送金"' });
      }
    },
    {
      title: '財務担当が本物と信じて送金実行',
      description: '映像と音声が揃っているため疑いを持たず、銀行に送金指示を出してしまう。',
      run: (stage) => {
        stage.flashActor('finance', 'shake', 1000);
        stage.sendPacket('finance', 'bank', { duration: 1000, className: 'benign', payload: '送金 25M USD' });
      }
    },
    {
      title: '攻撃者の口座へ着金',
      description: '事前準備された口座経由で資金が攻撃者へ。コールバック検証 + 多人数承認で防御可能。',
      run: (stage) => {
        stage.sendPacket('bank', 'attacker', { duration: 1100, payload: '着金' });
      }
    }
  ]
};
