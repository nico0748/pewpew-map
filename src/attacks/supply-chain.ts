import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'supply-chain')!;

export const supplyChain: AttackDefinition = {
  meta,
  caseStudy:
    '2020年 SolarWinds Orion アップデート経路の汚染で米政府機関を含む数千組織が侵害。2021年 Log4j脆弱性の世界的影響、2024年 XZ Utils バックドア混入未遂など、ソフトウェアサプライチェーンを起点とする攻撃が現代の重大リスクとして継続発生している。',
  damage: [
    { head: '広範囲・同時多発:', body: '汚染ライブラリ/アップデートを利用する全顧客が一斉に被害を受ける。' },
    { head: '"信頼された署名" の悪用:', body: '正規ベンダの署名付きで配布されるため検知・遮断が困難。' },
    { head: '内部侵入の起点化:', body: 'CI/CD やライブラリ経由で侵入され、APT的な長期侵害につながる。' },
    { head: 'OSS依存の事故:', body: '直接依存していなくても推移的依存(transitive)経由で影響を受ける。' }
  ],
  defense: [
    { head: 'SBOM運用:', body: '使用する全コンポーネントを把握。CVE発生時に影響箇所を即特定できる体制。' },
    { head: '依存ロックと再現性:', body: 'package-lock / go.sum / Cargo.lock を必ずコミット。' },
    { head: '署名検証/SLSA:', body: 'ビルド成果物の出所と改ざんを検証可能にする。' },
    { head: '更新の段階適用:', body: '"即適用"でなくテスト環境を経由。重大更新は監視を強化して段階展開。' },
    { head: 'ゼロトラスト & 最小権限:', body: '信頼された経路でも内部での権限を限定し、侵害時の被害範囲を抑える。' }
  ],
  devNote: [
    { head: 'Dependabot / Renovate:', body: '依存の脆弱性を継続検出。自動PRをCIで型/テスト確認して導入。' },
    { head: 'CI/CDの権限分離:', body: 'デプロイトークンに必要最小限の権限のみ。第三者Action/Imageの利用も限定。' },
    { head: 'pinned dependency:', body: 'GitHub Actions等は @v3 ではなく commit SHA でピン留め。' },
    { head: 'プライベートレジストリ:', body: '意図的に同名パッケージを横入りさせる "依存混乱攻撃" を防ぐためスコープ/レジストリを明示。' },
    { head: 'シークレットの隔離:', body: 'CIの環境変数を最小権限化。漏洩前提の自動ローテも検討。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('vendor',   { pict: 'server',   pos: { x: 0.30, y: 0.5  }, label: 'ベンダ/CI/CD' });
    stage.addActor('package',  { pict: 'document', pos: { x: 0.55, y: 0.5  }, label: '正規署名済パッケージ' });
    stage.addActor('cust1',    { pict: 'server',   pos: { x: 0.85, y: 0.18 }, label: '顧客企業A' });
    stage.addActor('cust2',    { pict: 'server',   pos: { x: 0.85, y: 0.50 }, label: '顧客企業B' });
    stage.addActor('cust3',    { pict: 'server',   pos: { x: 0.85, y: 0.82 }, label: '顧客企業C' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('攻撃者がベンダのビルド基盤に侵入');
          stage.sendPacket('attacker', 'vendor', { duration: 800, payload: 'CI/CD侵入' });
        }, hold: 900 },
        { run: () => {
          stage.flashActor('vendor', 'shake', 600);
          stage.status('正規ビルドにバックドアを忍ばせて署名・配布');
          stage.sendPacket('vendor', 'package', { duration: 700, payload: 'with backdoor' });
        }, hold: 800 },
        { run: () => {
          stage.status('顧客は正規アップデートとして自動配信を受け取る');
          stage.sendPacket('package', 'cust1', { duration: 800, className: 'benign', payload: '正規署名の更新' });
          stage.sendPacket('package', 'cust2', { duration: 800, className: 'benign', payload: '正規署名の更新' });
          stage.sendPacket('package', 'cust3', { duration: 800, className: 'benign', payload: '正規署名の更新' });
        }, hold: 1000 },
        { run: () => {
          stage.flashActor('cust1', 'shake', 700);
          stage.flashActor('cust2', 'shake', 700);
          stage.flashActor('cust3', 'shake', 700);
          stage.status('全顧客で同時にバックドアが起動');
        }, hold: 900 },
        { run: () => {
          stage.sendPacket('cust1', 'attacker', { duration: 900, payload: 'beacon' });
          stage.sendPacket('cust2', 'attacker', { duration: 900, payload: 'beacon' });
          stage.sendPacket('cust3', 'attacker', { duration: 900, payload: 'beacon' });
        }, hold: 1100 },
        { run: () => stage.status('攻撃完了: SBOM + SLSA + ピン留め依存 + 段階適用 で被害軽減') }
      ]);
    };
  }
};
