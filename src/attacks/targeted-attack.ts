import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'targeted-attack')!;

export const targetedAttack: AttackDefinition = {
  meta,
  appliesIf: [
    { head: '機密情報を扱う組織:', body: '製造/研究/医療/防衛/金融/自治体など、価値ある情報を持つ組織はAPTの常習的標的。' },
    { head: '従業員に業務メールが届く環境:', body: '標的型メールはAPTの初期侵入経路として最頻出。' },
    { head: 'VPN/RDP/管理者アカウントを運用している:', body: '弱点を突かれて初期侵入される代表的な経路。' },
    { head: 'ログ集約・SIEM/SOCがない:', body: '潜伏型攻撃は単発ログでは見えない。横断的な相関分析が必須。' },
    { head: '管理者権限を常時保有しているアカウントがある:', body: 'PAMやJust-In-Timeアクセスが無いと、奪取後の被害範囲が一気に広がる。' }
  ],
  caseStudy:
    '2015年 日本年金機構の標的型メールによる事案で約125万件の個人情報流出。海外でも国家関与とされるAPTグループによる長期潜伏(数か月〜数年)型の侵害が、製造業・防衛関連・研究機関・自治体に対して継続報告されている。',
  damage: [
    { head: '機密情報の継続的な窃取:', body: '研究データ・設計図・経営情報・人事情報が長期間にわたり流出。' },
    { head: '権限昇格と横展開:', body: 'AD/ドメインを掌握され、組織全体が制圧される。' },
    { head: 'バックドア常駐:', body: '通常のIT運用では気付けず、再侵入が容易に行われる。' },
    { head: '取引先への波及:', body: '窃取情報が取引先・顧客に対する追加攻撃に使われる。' }
  ],
  defense: [
    { head: '多層防御 (Defense in Depth):', body: '入口/内部/出口の各境界で異常検知を組み合わせる。' },
    { head: 'ゼロトラスト:', body: '社内ネットワーク=安全という前提を捨て、各通信を都度検証。' },
    { head: 'EDR + SIEM + SOC:', body: '横展開・C2通信を行動ベースで検知し封じ込め。' },
    { head: '訓練:', body: '標的型メール訓練と机上演習を定期実施。' },
    { head: '特権アカウント管理(PAM):', body: '管理者権限の常時保有を避け、貸出・記録・自動失効。' }
  ],
  devNote: [
    { head: 'ログ集約と保全:', body: '攻撃の全体像を後から再構築できるよう、認証ログ/プロキシログ/EDRログを長期保管。' },
    { head: '出口対策(C2通信遮断):', body: '社内→外部の通信もホワイトリスト/プロキシ強制で監視。' },
    { head: '"VPN/SaaS資格情報" の保護:', body: '生産性向上のために緩めた認証は侵入の本命入口になる。' },
    { head: 'シークレット管理:', body: 'コードや設定ファイルにAPIキー/接続情報を残さない。Secret Managerを使う。' },
    { head: 'インシデント想定の設計:', body: 'アプリ側でも"侵害された前提"の権限分離・監査ログを実装する。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'org', x: 0.36, y: 0.04, w: 0.42, h: 0.92, label: '対象組織', variant: 'victim' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: 'APTグループ' });
    stage.addActor('mail',     { pict: 'email',    pos: { x: 0.25, y: 0.5  }, label: '標的型メール' });
    stage.addActor('employee', { pict: 'user',     pos: { x: 0.45, y: 0.5  }, label: '従業員' });
    stage.addActor('endpoint', { pict: 'browser',  pos: { x: 0.65, y: 0.20 }, label: '感染端末' });
    stage.addActor('ad',       { pict: 'server',   pos: { x: 0.65, y: 0.80 }, label: '社内AD/ファイルサーバ' });
    stage.addActor('exfil',    { pict: 'document', pos: { x: 0.90, y: 0.5  }, label: '機密データ' });
    stage.addConnection('endpoint', 'ad', { id: 'lateral', variant: 'aux', dashed: true });
    stage.addConnection('ad', 'exfil', { id: 'collect', variant: 'aux', dashed: true });
  },
  steps: [
    {
      title: '業務に偽装した標的型メール',
      description: '攻撃者が、相手組織に詳しい内容で書かれた業務文書を装ったメールを送付する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'mail', { duration: 1000, payload: '請求書.docx (マクロ付)' });
      }
    },
    {
      title: '従業員に届く',
      description: '一見正規の取引先や社内連絡に見えるため、開かれてしまうことが多い。',
      run: (stage) => {
        stage.sendPacket('mail', 'employee', { duration: 1000, payload: '"確認お願いします"' });
      }
    },
    {
      title: '添付ファイル開封 → 端末感染',
      description: 'マクロ付きDocやリンクから不正実行が起き、端末がマルウェアに感染する。',
      run: (stage) => {
        stage.sendPacket('employee', 'endpoint', { duration: 1000, className: 'benign', payload: '開封' });
        stage.after(900, () => stage.flashActor('endpoint', 'shake', 1000));
      }
    },
    {
      title: '長期潜伏 → 横展開',
      description: 'すぐには活動を始めず、認証情報を集めながら社内サーバ/ADへ侵入を広げる。',
      run: (stage) => {
        stage.sendPacket('endpoint', 'ad', { duration: 1300, payload: 'lateral movement' });
      }
    },
    {
      title: '機密データを集約',
      description: 'AD・ファイルサーバから組織の機密情報を整理・集約する。',
      run: (stage) => {
        stage.flashActor('ad', 'shake', 800);
        stage.sendPacket('ad', 'exfil', { duration: 1000, className: 'benign', payload: 'collect' });
      }
    },
    {
      title: '暗号化して外部送信',
      description: '通信を正常な業務通信に紛れ込ませる形で暗号化してC&Cへ送信する。',
      run: (stage) => {
        stage.sendPacket('exfil', 'attacker', { duration: 1300, payload: 'encrypted exfil' });
      }
    }
  ],
  beginner: {
    summary:
      '特定の会社や組織だけを狙って、何ヶ月もかけて静かに侵入を広げ、機密情報を持ち出していく長期型の攻撃。',
    appliesIf: [
      { head: '機密情報を扱う会社・組織で働いている:', body: '製造業・医療・研究機関・自治体・金融など、価値ある情報を持っている組織は常習的な標的です。' },
      { head: '社員に取引先からのメールが届く:', body: '標的型攻撃の入り口はほとんどがメールの添付ファイルやリンクです。' },
      { head: 'VPNやリモートデスクトップを公開している:', body: '弱点を突かれて初期侵入される代表的な経路。' },
      { head: 'ログを一箇所に集めて見ていない:', body: '長期に潜む攻撃は単発のログでは気付けません。横断的に分析する仕組みが必要。' },
      { head: '管理者アカウントを常時使う運用になっている:', body: '管理者権限が奪われた瞬間に被害が一気に広がります。必要時だけ貸し出す運用に。' }
    ],
    caseStudy:
      '2015年、日本年金機構が「業務メールに見せかけた標的メール」をきっかけに侵入され、約125万件もの個人情報が流出しました。海外でも、国家が背後にいるとされる攻撃グループが、製造業・防衛・研究機関・自治体などに対して数ヶ月から数年もの長期にわたり潜んで情報を盗む事案が今も続いています。',
    damage: [
      {
        head: '機密情報を継続的に盗まれる:',
        body: '研究データ・設計図・経営情報・人事情報などが、長期間こっそり持ち出されます。'
      },
      {
        head: '管理者権限まで奪われ組織全体が制圧:',
        body: '社員のIDを管理する仕組み(Active Directory)を奪われ、組織全体のシステムが攻撃者の支配下に入ります。'
      },
      {
        head: '裏口を仕掛けられて再侵入される:',
        body: '通常のIT運用では気付けない裏口(バックドア)を残されて、何度でも入り直されます。'
      },
      {
        head: '取引先まで被害が広がる:',
        body: '盗まれた情報を使って、取引先や顧客に対する追加攻撃が仕掛けられます。'
      }
    ],
    defense: [
      {
        head: '何重にも防御を重ねる(多層防御):',
        body: '入口(メール・Web)、内部(端末・サーバ)、出口(外への通信)それぞれで「異常を見つける仕組み」を組み合わせます。'
      },
      {
        head: '社内ネットも信用しない(ゼロトラスト):',
        body: '「社内だから安全」という前提を捨て、すべての通信に対してその都度本人確認・許可確認を行う設計に切り替えます。'
      },
      {
        head: '端末・ログ監視・対応チームの3点セット:',
        body: 'EDR(端末上の不審な動きを見張るソフト)+ SIEM(ログを集約して相関分析する仕組み)+ SOC(24時間監視する専門チーム)で、潜伏しても気付ける体制を作ります。'
      },
      {
        head: '訓練を定期実施:',
        body: '標的型メールの訓練(疑似メールで反応を見る)や、机上演習(架空の侵入を想定した手順確認)を定期的にやります。'
      },
      {
        head: '管理者権限を「常時持たない」運用:',
        body: '管理者アカウントを常時使うのではなく、必要な時だけ申請・貸出・記録・自動失効する仕組み(PAM)で運用します。'
      }
    ],
    devNote: [
      {
        head: 'ログを集めて長期保存:',
        body: '攻撃の全体像を後から再現できるように、ログイン履歴・プロキシのログ・端末監視ソフト(EDR)のログを長期保管します。'
      },
      {
        head: '社内→外部通信も監視(出口対策):',
        body: '社内から外への通信を全部プロキシ経由にし、許可していないドメインへの通信は遮断・記録します(C2通信を見つけるため)。'
      },
      {
        head: 'VPNやSaaSの認証を緩めない:',
        body: '便利さのために認証を緩めると、そこが侵入の本命入口になります。多要素認証は必須。'
      },
      {
        head: '機密情報をコードに書かない:',
        body: 'APIキーや接続情報をソースコードや設定ファイルに残さず、Secret Manager のような専用の保管庫を使います。'
      },
      {
        head: '「侵入された前提」で作る:',
        body: 'アプリ側でも権限分離・操作の監査ログ・最小権限の徹底を入れ、万一侵入されても被害が広がらない設計にしておきます。'
      }
    ],
    steps: [
      {
        title: '業務メールにそっくりな「狙い撃ちメール」が届く',
        description:
          '攻撃者が、対象組織の事情をしっかり下調べした上で、業務文書を装ったメールを特定の従業員に送ります。'
      },
      {
        title: '従業員には自然な業務メールに見える',
        description:
          '「請求書を確認してください」など、いつも通りの依頼に見えるため、開かれやすい。'
      },
      {
        title: '添付や仕込まれたリンクから端末が感染',
        description:
          'マクロ付きの Word 文書や偽サイトから、攻撃用プログラムが端末に入り込みます。'
      },
      {
        title: 'すぐには動かず、社内を静かに広げる',
        description:
          '感染を派手に出さず、IDやパスワードを集めながら、ゆっくり社内サーバや認証基盤(Active Directory)へ侵入を広げます。'
      },
      {
        title: '機密データを集める',
        description:
          'ファイルサーバや認証基盤から、組織の重要書類を選んで集めます。'
      },
      {
        title: '暗号化して、業務通信に紛らせて外へ',
        description:
          '集めたデータを暗号化し、ふつうの業務通信に紛れる形で攻撃者の外部サーバへ送り出します。多層防御 + ゼロトラスト + 出口対策で潜伏を防ぎます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃グループ',
      mail: '狙い撃ちメール',
      employee: '従業員',
      endpoint: '感染した端末',
      ad: '社内のID管理 / ファイルサーバ',
      exfil: '集められた機密データ'
    },
    groupLabels: {
      org: '狙われた組織の中'
    },
    connectionLabels: {
      lateral: '内部を静かに広げる',
      collect: '機密を集める'
    }
  }
};
