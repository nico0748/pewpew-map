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
  ]
};
