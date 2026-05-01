import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'ssrf')!;

export const ssrf: AttackDefinition = {
  meta,
  caseStudy:
    '2019年 Capital One の事案で、WAFの設定不備を悪用したSSRFによりAWSのインスタンスメタデータサービス(169.254.169.254/IMDSv1)から一時クレデンシャルを奪取され、約1億件分の顧客情報がS3から流出した。 OWASP Top 10 では2021年に新カテゴリ A10 として独立し、クラウド時代の代表的な脆弱性として認知されている。',
  damage: [
    { head: 'クラウドメタデータ流出:', body: 'IMDS経由で IAM 一時クレデンシャルを奪われ、AWS/GCP/Azure を横断的に侵害される。' },
    { head: '内部サービス攻撃:', body: '社内専用のRedis/Elasticsearch/管理画面に外部から到達される。' },
    { head: 'ポートスキャン:', body: '内部ネットワークのトポロジ情報が漏れる。' },
    { head: 'ファイル読込:', body: 'file:// スキームで /etc/passwd 等のローカルファイルが読まれることも。' }
  ],
  defense: [
    { head: 'IMDSv2 強制:', body: 'AWSのインスタンスメタデータはトークン必須のIMDSv2 のみ許可。古いIMDSv1 は無効化。' },
    { head: 'URL ホワイトリスト:', body: 'アプリから外部にHTTPする際は許可ドメインのみ。schemeも http(s) に限定。' },
    { head: 'メタデータIP遮断:', body: 'アプリプロセスから 169.254.169.254 / 169.254.170.2 / fd00:ec2::254 への通信をネットワーク層で遮断。' },
    { head: 'DNSリバインディング対策:', body: 'リダイレクト追跡時のIP再解決と private IP判定を厳格化。' },
    { head: 'ネットワークセグメンテーション:', body: 'Webアプリ層から内部管理ネットへの直接アクセスを禁止。' }
  ],
  devNote: [
    { head: '"URLを受け取って fetch する機能" は要注意:', body: 'プレビュー生成・OG画像取得・Webhook・PDFレンダ等は SSRF 攻撃面。設計レビューで毎回確認。' },
    { head: 'リダイレクト追跡を制御:', body: 'http→file/gopher 等のスキーム変化、private IPへのリダイレクトをライブラリ任せにしない。' },
    { head: 'サブネット判定:', body: 'RFC1918/loopback/link-localなど private CIDR を網羅。IPv6 (::1, fc00::/7, fe80::/10) も忘れない。' },
    { head: 'ヘッダー注入と組み合わせ:', body: 'Host/X-Forwarded-Host による内部ルーティングと組み合わせる Blind SSRF にも備える。' },
    { head: 'タイムアウトと監査ログ:', body: '外向きHTTPは必ずタイムアウト + 構造化ログ。リクエスト先と応答ステータスを残す。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.05, y: 0.5  }, label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.30, y: 0.5  }, label: 'Webアプリ' });
    stage.addActor('imds',     { pict: 'server',   pos: { x: 0.55, y: 0.20 }, label: 'IMDS (169.254.169.254)' });
    stage.addActor('internal', { pict: 'database', pos: { x: 0.55, y: 0.80 }, label: '内部サービス' });
    stage.addActor('cloud',    { pict: 'server',   pos: { x: 0.85, y: 0.5  }, label: 'クラウドAPI' });
  },
  steps: [
    {
      title: 'URL受け取り機能に内部URLを投入',
      description: 'プレビュー生成等の "URLを取得して処理" 機能に http://169.254.169.254/... のような内部URLを送る。',
      run: (stage) => {
        stage.sendPacket('attacker', 'app', { duration: 1100, payload: 'url=http://169.254.169.254/...' });
      }
    },
    {
      title: 'アプリが内部メタデータへ自らアクセス',
      description: 'アプリは検証なしで指定URLにHTTP GETを行う。内部からは到達できてしまう。',
      run: (stage) => {
        stage.sendPacket('app', 'imds', { duration: 1000, payload: 'GET /latest/meta-data' });
      }
    },
    {
      title: '一時クレデンシャル/内部情報を取得',
      description: 'IMDS は IAM ロールの一時クレデンシャルを返してしまう。内部サービスへのアクセスにも応用される。',
      run: (stage) => {
        stage.flashActor('imds', 'shake', 700);
        stage.sendPacket('imds', 'app', { duration: 900, className: 'benign', payload: 'AccessKey/Secret' });
        stage.sendPacket('app', 'internal', { duration: 1000, payload: 'GET /admin' });
      }
    },
    {
      title: 'クラウドリソースを横断的に奪取',
      description: '一時クレデンシャルでクラウドAPIに対し本人として操作でき、S3等から大規模に情報窃取される。',
      run: (stage) => {
        stage.sendPacket('app', 'cloud', { duration: 1000, payload: 'aws s3 ls' });
        stage.after(900, () => {
          stage.flashActor('cloud', 'shake', 800);
          stage.sendPacket('cloud', 'attacker', { duration: 1100, payload: '顧客データ' });
        });
      }
    }
  ],
  beginner: {
    summary:
      '「サーバが裏でアクセスを代行する機能」を悪用して、本来外からは届かないクラウドの内側や社内サービスにアクセスさせてしまう攻撃。',
    caseStudy:
      '2019年、米国の銀行 Capital One で、WAF の設定不備を突かれて SSRF 攻撃を受けました。攻撃者は AWS の「インスタンス情報を返す内部の特殊なアドレス(169.254.169.254)」にサーバから問い合わせをさせ、クラウドの一時的な認証情報を奪取。そのキーで S3(クラウドのファイル保管庫)から約 1 億件の顧客情報を持ち出されました。SSRF はクラウド時代の代表的な弱点として、OWASP Top 10 でも独立して扱われるようになっています。',
    damage: [
      {
        head: 'クラウドの認証情報を奪われる:',
        body: 'AWS / GCP / Azure には「自分自身に問い合わせると一時的な認証キーが返ってくる特殊なアドレス」があります。SSRF でそこへアクセスさせられると、その鍵を抜かれてクラウド全体が侵害されます。'
      },
      {
        head: '社内専用サービスを叩かれる:',
        body: '社内からしかアクセスできないはずの Redis(高速なデータ保管)・Elasticsearch(検索エンジン)・管理画面に、外部からアプリ経由で到達されてしまいます。'
      },
      {
        head: '社内ネットワークの構成情報が漏れる:',
        body: 'アプリにポートスキャンを代行させて、社内のサーバ配置や開いているポート情報を抜かれます。'
      },
      {
        head: 'ローカルファイルまで読まれることも:',
        body: '`file://` のような URL の書き方を許してしまうと、サーバ内の `/etc/passwd` のようなローカルファイルが読み出されてしまいます。'
      }
    ],
    defense: [
      {
        head: 'AWSではIMDSv2を必須にする:',
        body: 'AWS のインスタンスメタデータは古い IMDSv1(SSRF に弱い)を無効化し、トークンが必要な IMDSv2 のみ許可します。'
      },
      {
        head: '外向きHTTPは「許可ドメインだけ」に絞る:',
        body: 'アプリが外部に HTTP する際は許可リスト方式にして、`http(s)` 以外のスキーム(`file://`, `gopher://` など)は弾きます。'
      },
      {
        head: 'メタデータIPへの通信を遮断:',
        body: 'アプリのプロセスから `169.254.169.254`(AWS) や `169.254.170.2`(ECS) への通信を、ネットワーク層で遮断します。'
      },
      {
        head: 'DNSの結果を信用しすぎない(DNSリバインディング対策):',
        body: 'リダイレクトを追跡する際、ドメインのIPアドレスが途中で社内アドレスに変わる手口があります。リクエスト直前に再解決して、社内アドレスでないか判定し直します。'
      },
      {
        head: 'ネットワーク分離:',
        body: 'Webアプリの層から内部管理ネットへ直接アクセスできないように、ネットワークをきちんと分けます。'
      }
    ],
    devNote: [
      {
        head: '「URLを受け取って取得する機能」を疑う:',
        body: 'リンクのプレビュー・OG画像取得・Webhook 受信・PDFレンダリングなど、ユーザの URL を受け取ってアプリが裏でフェッチする系の機能は SSRF の温床です。設計レビューで毎回確認。'
      },
      {
        head: 'リダイレクト追跡をライブラリ任せにしない:',
        body: '`http` から `file` などへスキームが変わるリダイレクトや、社内アドレスへのリダイレクトをHTTPライブラリが勝手に追わないように制御します。'
      },
      {
        head: '社内アドレス判定を網羅:',
        body: 'プライベート IP(`10.0.0.0/8` `172.16.0.0/12` `192.168.0.0/16`)、ループバック(`127.0.0.1`)、リンクローカル(`169.254.0.0/16`)を全部弾く。IPv6(`::1` `fc00::/7` `fe80::/10`)も忘れない。'
      },
      {
        head: 'Hostヘッダ注入との合わせ技に注意:',
        body: '`Host` や `X-Forwarded-Host` の改ざんと組み合わせて、応答の中身が見えなくても成立する Blind SSRF にも備える。'
      },
      {
        head: 'タイムアウトと監査ログ必須:',
        body: '外向き HTTP には必ずタイムアウトを設定し、リクエスト先と応答ステータスを構造化ログに残しましょう。'
      }
    ],
    steps: [
      {
        title: '攻撃者がアプリのURL受け取り機能に内部URLを送る',
        description:
          'プレビュー生成のような「URLを受け取ってアプリが裏で取得する機能」に、攻撃者が `http://169.254.169.254/...` のような社内アドレスを指定します。'
      },
      {
        title: 'アプリは検証せずに自分から内部にアクセスしてしまう',
        description:
          'アプリは外からは届かない内部アドレスにも、自分自身からなら届くので、指定された URL に普通に GET してしまいます。'
      },
      {
        title: 'クラウドの認証情報や社内データが取得される',
        description:
          'IMDS(クラウドメタデータ)が一時的な認証キーを返してしまい、社内サービスもアプリ経由でアクセスされます。'
      },
      {
        title: 'クラウド全体を本人扱いで操作される',
        description:
          '攻撃者は手に入れた認証キーでクラウド API を「本人」として叩けるようになり、S3 のような保管庫から大量にデータを持ち出されます。IMDSv2 強制 + 外向き通信の許可リスト + メタデータIP遮断で防げます。'
      }
    ],
    actorLabels: {
      attacker: '攻撃者',
      app: 'アプリ(画面の裏で動くプログラム)',
      imds: 'クラウドのメタデータ受付(社内専用)',
      internal: '社内専用サービス',
      cloud: 'クラウドのAPI'
    }
  }
};
