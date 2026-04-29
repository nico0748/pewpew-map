import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'ransomware')!;
const docs = ['doc1', 'doc2', 'doc3', 'doc4'];

export const ransomware: AttackDefinition = {
  meta,
  caseStudy:
    '2017年 WannaCry が世界的に拡大し、欧州医療機関で診療システムが停止。日本でも2022年に大手食品/医療法人で社内システムが停止し、長期にわたる業務影響が発生した。',
  damage: [
    { head: '業務停止:', body: '基幹システムや医療電子カルテが暗号化され、業務が長期間停止。' },
    { head: '二重脅迫:', body: '「復号鍵料」と「公開しない料」の二段階で身代金を要求される。' },
    { head: '情報漏洩:', body: '事前に窃取された顧客/取引先情報が暗黒街サイトで公開される。' },
    { head: '復旧コスト:', body: '身代金を払っても完全復旧する保証はなく、再構築コストが膨らむ。' }
  ],
  defense: [
    { head: '多要素認証(MFA):', body: 'VPN/RDP/管理者アカウントは必ずMFA。攻撃の起点を塞ぐ。' },
    { head: 'バックアップの3-2-1ルール:', body: '3世代/2媒体/1オフラインで持ち、暗号化攻撃から隔離。' },
    { head: 'EDR/SOC:', body: '横展開と暗号化開始の挙動を早期検知し封じ込める。' },
    { head: '脆弱性管理:', body: 'VPN機器・公開サーバのパッチ適用を最優先。' },
    { head: '訓練と演習:', body: '机上演習・実機演習で復旧フローを定期検証。' }
  ],
  devNote: [
    { head: '管理画面/SSHを公開しない:', body: 'IP制限+踏み台+MFAを徹底。"とりあえず公開"の暫定設定を残さない。' },
    { head: '権限分離:', body: 'アプリ用ユーザに不要な書込権限/共有マウントを与えない。被害範囲を限定。' },
    { head: 'ログの外部退避:', body: 'ローカルログだけだと侵害時に消される。集約基盤へ即時送出する。' },
    { head: '依存ライブラリ管理:', body: '攻撃の入り口となる脆弱性は依存に潜む。SBOM/Dependabot等で継続把握。' },
    { head: 'バックアップの "復元テスト":', body: '取得しているだけでは無意味。復元できることを定期検証する。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.08, y: 0.5  }, label: '攻撃者' });
    stage.addActor('vpn',      { pict: 'server',   pos: { x: 0.32, y: 0.5  }, label: 'VPN/RDP' });
    stage.addActor('doc1',     { pict: 'document', pos: { x: 0.58, y: 0.18 } });
    stage.addActor('doc2',     { pict: 'document', pos: { x: 0.58, y: 0.42 }, label: '社内ファイル' });
    stage.addActor('doc3',     { pict: 'document', pos: { x: 0.58, y: 0.66 } });
    stage.addActor('doc4',     { pict: 'document', pos: { x: 0.58, y: 0.90 } });
    stage.addActor('ransom',   { pict: 'warning',  pos: { x: 0.85, y: 0.5  }, label: '身代金要求' });
  },
  steps: [
    {
      title: '初期侵入',
      description: 'VPN/RDPの脆弱性、もしくは漏洩した認証情報を使って社内ネットワークに侵入する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'vpn', { duration: 1100, payload: 'login (stolen)' });
      }
    },
    {
      title: '横展開',
      description: '社内ネットワークを偵察し、攻撃可能なファイルサーバ・端末を順番に把握する。',
      run: (stage) => {
        docs.forEach((d, i) => {
          stage.after(i * 300, () => stage.sendPacket('vpn', d, { duration: 700, className: 'benign', payload: 'recon' }));
        });
      }
    },
    {
      title: 'ファイルを順次暗号化',
      description: '対象ファイルを順番に暗号化し、開けない状態にしていく。',
      run: (stage) => {
        docs.forEach((d, i) => {
          stage.after(i * 500, () => {
            stage.flashActor(d, 'shake', 700);
            stage.setActorPict(d, 'lock', '暗号化済');
          });
        });
      }
    },
    {
      title: '身代金要求',
      description: '画面に脅迫文が出る。暗号通貨での支払いを要求し、応じなければ流出させると脅す(二重脅迫)。',
      run: (stage) => {
        stage.flashActor('ransom', 'shake', 1100);
        stage.sendPacket('ransom', 'attacker', { duration: 1300, payload: '$$$ 暗号通貨' });
      }
    }
  ]
};
