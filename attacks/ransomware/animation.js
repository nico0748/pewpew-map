import { Stage, sequence } from '../../assets/js/animator.js';
import { renderAttackPage } from '../../assets/js/page.js';

const stage = new Stage('#stage');
stage.addActor('attacker', 'attacker', { x: 0.08, y: 0.5 }, '攻撃者');
stage.addActor('vpn',      'server',   { x: 0.32, y: 0.5 }, 'VPN/RDP');
// 社内ドキュメント群
stage.addActor('doc1', 'document', { x: 0.58, y: 0.18 }, '');
stage.addActor('doc2', 'document', { x: 0.58, y: 0.42 }, '社内ファイル');
stage.addActor('doc3', 'document', { x: 0.58, y: 0.66 }, '');
stage.addActor('doc4', 'document', { x: 0.58, y: 0.90 }, '');
stage.addActor('ransom',  'warning', { x: 0.85, y: 0.5 }, '身代金要求');

renderAttackPage({
  title: 'ランサムウェア',
  titleEn: 'Ransomware',
  caseStudy: '2017年 WannaCry が世界的に拡大し、欧州医療機関で診療システムが停止。日本でも2022年に大手食品/医療法人で社内システムが停止し、長期にわたる業務影響が発生した。',
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
  ]
});

document.getElementById('play').addEventListener('click', play);
document.getElementById('reset').addEventListener('click', () => { stage.reset(); stage.status('準備完了'); });

function play() {
  stage.reset();
  stage.status('攻撃シナリオ再生中…');
  const docs = ['doc1','doc2','doc3','doc4'];

  sequence([
    { delay: 0, run: () => {
      stage.status('VPN/RDPの脆弱性 or 漏洩クレデンシャルで侵入');
      stage.sendPacket('attacker', 'vpn', { duration: 800, payload: 'login (stolen)' });
    }, hold: 900 },
    { delay: 0, run: () => {
      stage.status('社内ネットワークへ横展開');
      docs.forEach((d, i) => {
        setTimeout(() => stage.sendPacket('vpn', d, { duration: 500, className: 'benign', payload: 'recon' }), i * 200);
      });
    }, hold: 1500 },
    { delay: 0, run: () => {
      stage.status('ファイルを順次暗号化');
      docs.forEach((d, i) => {
        setTimeout(() => {
          stage.flashActor(d, 'shake', 500);
          stage.setActorPict(d, 'lock', '暗号化済');
        }, i * 350);
      });
    }, hold: 1800 },
    { delay: 0, run: () => {
      stage.status('身代金を要求');
      stage.flashActor('ransom', 'shake', 800);
      stage.sendPacket('ransom', 'attacker', { duration: 1100, payload: '$$$ 暗号通貨' });
    }, hold: 1300 },
    { delay: 0, run: () => {
      stage.status('攻撃完了: MFA + オフラインバックアップ + EDR で被害を最小化');
    }, hold: 0 }
  ]);
}
