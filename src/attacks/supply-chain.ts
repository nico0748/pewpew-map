import type { AttackDefinition } from '../types';
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
    stage.addGroup({ id: 'customers', x: 0.74, y: 0.02, w: 0.24, h: 0.96, label: '顧客企業群', variant: 'victim' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('vendor',   { pict: 'server',   pos: { x: 0.30, y: 0.5  }, label: 'ベンダ/CI/CD' });
    stage.addActor('package',  { pict: 'document', pos: { x: 0.55, y: 0.5  }, label: '正規署名済パッケージ' });
    stage.addActor('cust1',    { pict: 'server',   pos: { x: 0.85, y: 0.18 }, label: '顧客企業A' });
    stage.addActor('cust2',    { pict: 'server',   pos: { x: 0.85, y: 0.50 }, label: '顧客企業B' });
    stage.addActor('cust3',    { pict: 'server',   pos: { x: 0.85, y: 0.82 }, label: '顧客企業C' });
    stage.addConnection('vendor', 'package', { id: 'build', variant: 'flow' });
    stage.addConnection('package', 'cust1', { id: 'dist1', variant: 'flow', dashed: true });
    stage.addConnection('package', 'cust2', { id: 'dist2', variant: 'flow', dashed: true });
    stage.addConnection('package', 'cust3', { id: 'dist3', variant: 'flow', dashed: true });
  },
  steps: [
    {
      title: 'ベンダのビルド基盤に侵入',
      description: '攻撃者が、最終標的ではなくその上流にあるベンダのビルド/CI環境に侵入する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'vendor', { duration: 1100, payload: 'CI/CD侵入' });
        stage.after(900, () => stage.flashActor('vendor', 'shake', 800));
      }
    },
    {
      title: '正規ビルドにバックドアを混入',
      description: 'ベンダの署名/配布フローに乗せて、バックドア付きパッケージを正規パッケージとして配布する。',
      run: (stage) => {
        stage.sendPacket('vendor', 'package', { duration: 1000, payload: 'with backdoor' });
      }
    },
    {
      title: '顧客は正規アップデートとして受信',
      description: '顧客側は署名検証も通る正規アップデートとして自動配信を受け取る。',
      run: (stage) => {
        stage.sendPacket('package', 'cust1', { duration: 1000, className: 'benign', payload: '正規署名の更新' });
        stage.sendPacket('package', 'cust2', { duration: 1000, className: 'benign', payload: '正規署名の更新' });
        stage.sendPacket('package', 'cust3', { duration: 1000, className: 'benign', payload: '正規署名の更新' });
      }
    },
    {
      title: '全顧客で同時にバックドアが起動',
      description: '更新を取り込んだ全顧客の環境で、ほぼ同時にバックドアが活性化する。',
      run: (stage) => {
        stage.flashActor('cust1', 'shake', 900);
        stage.flashActor('cust2', 'shake', 900);
        stage.flashActor('cust3', 'shake', 900);
      }
    },
    {
      title: '攻撃者へビーコン送信',
      description: '各顧客の環境から攻撃者C&Cへビーコンが届き、攻撃者は次のステップへ進める。',
      run: (stage) => {
        stage.sendPacket('cust1', 'attacker', { duration: 1100, payload: 'beacon' });
        stage.sendPacket('cust2', 'attacker', { duration: 1100, payload: 'beacon' });
        stage.sendPacket('cust3', 'attacker', { duration: 1100, payload: 'beacon' });
      }
    }
  ],
  beginner: {
    summary:
      '直接の標的ではなく、その会社が使っているソフトの「作り手」や「ライブラリ」を狙って汚染し、まとめて被害を広げる攻撃。',
    caseStudy:
      '2020年、SolarWinds Orion という管理ソフトのアップデート配信が汚染され、米政府機関を含む数千の組織が一気に侵害されました。2021年には Log4j という Java のログ用ライブラリの弱点が世界中に影響、2024年には Linux で広く使われる XZ Utils に裏口を仕込まれかけた事件もあり、ソフトの供給経路(サプライチェーン)を経由した攻撃は今も大きなリスクです。',
    damage: [
      {
        head: '一斉に多くの顧客が被害:',
        body: 'そのソフトを使っているすべての顧客が、同時に汚染されたバージョンを取り込んで一斉に被害を受けます。'
      },
      {
        head: '「正規の署名」のせいで気付きにくい:',
        body: '正規ベンダの電子署名が付いた状態で配布されるため、「これは安全」と判定されてしまい検知できません。'
      },
      {
        head: '社内侵入の足場にされる:',
        body: '取り込まれたパッケージを足場に、社内のCI/CD(自動ビルド・自動デプロイの仕組み)などへ侵入を広げられます。'
      },
      {
        head: '直接使っていない部品からも被害:',
        body: 'あるライブラリが内部で別のライブラリを使っている、という連鎖で、自分が直接入れていない部品の弱点でも巻き込まれます(推移的依存)。'
      }
    ],
    defense: [
      {
        head: '使っている部品の一覧を作る(SBOM):',
        body: '自社のシステムで使っているライブラリ・コンポーネントの一覧(SBOM = Software Bill of Materials)を整備して、新しい弱点が見つかったとき影響範囲を即座に特定できるようにします。'
      },
      {
        head: '依存をロックして再現性を保つ:',
        body: '`package-lock.json` / `go.sum` / `Cargo.lock` などのロックファイルを必ずコミットし、いつ誰がビルドしても同じバージョンになるようにします。'
      },
      {
        head: 'ビルド成果物の出所を検証(SLSA):',
        body: 'ビルドした成果物が「いつ・どこで・どうやって」作られたかを検証できる仕組み(SLSA や Sigstore など)を使います。'
      },
      {
        head: '更新は段階的に適用:',
        body: '即本番投入はせず、テスト環境を経由。重大な更新は監視を強めて段階展開します。'
      },
      {
        head: 'ゼロトラスト + 最小権限:',
        body: '万一信頼経路が汚染されても被害を抑えられるよう、内部での権限を最小限に絞ります。'
      }
    ],
    devNote: [
      {
        head: 'Dependabot / Renovate を入れる:',
        body: '依存ライブラリの新しい弱点を自動で検出し、修正PRを自動生成する仕組み(Dependabot や Renovate)を導入します。'
      },
      {
        head: 'CI/CDの権限を絞る:',
        body: 'デプロイに使うトークンには必要最小限の権限だけ渡す。第三者製の GitHub Action やコンテナイメージも、信頼できる範囲だけに絞ります。'
      },
      {
        head: '依存はSHAで固定する:',
        body: 'GitHub Actions などは `@v3` のようなタグではなく、コミットの SHA でピン留めしましょう。タグはあとから差し替え可能です。'
      },
      {
        head: '社内レジストリで「依存混乱攻撃」を防ぐ:',
        body: '社内パッケージと同名のものを公開レジストリに置かれ、そっちが優先されてしまう手口(依存混乱)を防ぐため、スコープやレジストリを明示。'
      },
      {
        head: 'シークレットを隔離:',
        body: 'CIで使う環境変数や認証情報は、必要なジョブだけに渡す。漏洩を前提にして自動ローテーションも検討しましょう。'
      }
    ],
    steps: [
      {
        title: '攻撃者がベンダのビルド基盤に侵入',
        description:
          '直接の標的ではなく、そこへソフトを供給しているベンダの「自動ビルド・配布の仕組み(CI/CD)」に侵入します。'
      },
      {
        title: '正規ビルドにこっそり裏口を混入',
        description:
          'ベンダの正規ビルドフローに乗せて、裏口(バックドア)入りのパッケージを「正規の署名付き」で配布します。'
      },
      {
        title: '顧客は普通の更新として受け取る',
        description:
          '顧客の自動更新は署名検証も問題なく通るので、正規の更新だと信じて取り込みます。'
      },
      {
        title: '全顧客環境で一斉に裏口が起動',
        description:
          '更新を取り込んだ全顧客の環境で、ほぼ同時に裏口が動き始めます。'
      },
      {
        title: '攻撃者の指令サーバへ通信',
        description:
          '各顧客の環境から、攻撃者の指令サーバへ「準備できました」の合図(ビーコン)が届き、ここから個別の侵入が始まります。SBOM + 依存ロック + 出所検証で被害範囲を縮められます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      vendor: 'ベンダの自動ビルド基盤',
      package: '正規署名つきパッケージ',
      cust1: '顧客企業A',
      cust2: '顧客企業B',
      cust3: '顧客企業C'
    },
    groupLabels: {
      customers: '影響を受ける顧客企業の集合'
    },
    connectionLabels: {
      build: 'ビルドして配布',
      dist1: '自動アップデート',
      dist2: '自動アップデート',
      dist3: '自動アップデート'
    }
  }
};
