import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'drive-by-download')!;

export const driveByDownload: AttackDefinition = {
  meta,
  appliesIf: [
    { head: '外部スクリプト(広告/分析)を読み込んでいる:', body: 'サードパーティ JS は改ざん経由で攻撃配信に化ける。' },
    { head: 'CMS(WordPress等)で運営している:', body: '改ざんの主要ターゲット。プラグイン含む継続更新が運用に乗っているか。' },
    { head: '複数サブドメインで同じ Cookie / 認証を共有:', body: '一箇所が改ざんされると全体に波及する。' },
    { head: 'iframe sandbox / SRI を使っていない:', body: '埋め込み外部コンテンツの権限制限・改ざん検知が無いと侵入路が開く。' },
    { head: 'CSPで script-src を絞っていない:', body: '改ざん時に任意外部スクリプトを実行されてしまう。' }
  ],
  caseStudy:
    '改ざんされた正規サイトや汚染された広告(Malvertising)を経由して、利用者がページを閲覧するだけで脆弱なブラウザ/プラグインを突かれマルウェアが自動ダウンロード・実行される事案が継続発生。Flash/IE時代に多発したが、今もブラウザのゼロデイを突く形態で続いている。',
  damage: [
    { head: 'マルウェア感染:', body: 'バンキング型・スパイ型・ランサムウェア等が無自覚にインストールされる。' },
    { head: '情報窃取:', body: '保存パスワード・Cookie・暗号通貨ウォレットを抜かれる。' },
    { head: '踏み台化:', body: 'ボットネット参加・社内ネットワークへの侵入起点にされる。' },
    { head: '広告経由の連鎖:', body: '正規サイト + 汚染広告で被害が広範囲に及ぶ(Malvertising)。' }
  ],
  defense: [
    { head: 'ブラウザ/OSの最新化:', body: '自動更新を有効化し、ゼロデイ修正を即時適用。' },
    { head: 'EDR/AV:', body: 'シグネチャ + 振る舞い検知でドロッパ実行を遮断。' },
    { head: '広告ブロック / DNSフィルタ:', body: '不審ドメインへの接続自体を遮断。' },
    { head: 'SmartScreen / Safe Browsing:', body: 'ブラウザの保護機能を有効化。' },
    { head: '権限分離:', body: 'ユーザ権限で実行されるため、管理者権限での日常運用を避ける。' }
  ],
  devNote: [
    { head: 'Subresource Integrity (SRI):', body: '外部CDNのJSをそのまま読み込まない。改ざん検知のためSRIを付与。' },
    { head: 'CSPで読み込み元を制限:', body: 'script-src/img-src を狭く絞り、第三者改ざん広告の影響を限定。' },
    { head: '広告タグ管理:', body: 'タグマネージャ/広告SDKは導入元の信頼性を継続評価。' },
    { head: 'iframe sandbox:', body: '埋め込み外部コンテンツは sandbox 属性で権限を最小化。' },
    { head: 'インシデント時の連絡経路:', body: '改ざん検知時のCDNパージ・告知手順をRunbook化しておく。' }
  ],
  setup(stage) {
    stage.addGroup({ id: 'attacker-infra', x: 0.50, y: 0.04, w: 0.46, h: 0.92, label: '攻撃者インフラ', variant: 'attack' });
    stage.addActor('victim',  { pict: 'user',     pos: { x: 0.10, y: 0.5  }, label: '利用者' });
    stage.addActor('site',    { pict: 'browser',  pos: { x: 0.36, y: 0.5  }, label: '改ざんサイト' });
    stage.addActor('exploit', { pict: 'warning',  pos: { x: 0.62, y: 0.5  }, label: 'Exploit Kit' });
    stage.addActor('payload', { pict: 'document', pos: { x: 0.85, y: 0.22 }, label: 'マルウェア' });
    stage.addActor('cnc',     { pict: 'attacker', pos: { x: 0.85, y: 0.78 }, label: '攻撃者C&C' });
    stage.addConnection('site', 'exploit', { id: 'redirect', variant: 'attack', dashed: true, label: 'redirect' });
    stage.addConnection('exploit', 'payload', { id: 'drop', variant: 'attack', dashed: true });
  },
  steps: [
    {
      title: '普段のサイトを閲覧',
      description: '利用者は普段通りに正規サイトを訪問するが、サイトはこっそり改ざんされている。',
      run: (stage) => {
        stage.sendPacket('victim', 'site', { duration: 1000, className: 'benign', payload: 'GET /' });
      }
    },
    {
      title: 'Exploit Kit へ自動リダイレクト',
      description: '埋め込まれた攻撃用JSが、ブラウザを攻撃者の Exploit Kit へリダイレクトさせる。',
      run: (stage) => {
        stage.sendPacket('site', 'exploit', { duration: 1000, payload: 'iframe → exploit kit' });
      }
    },
    {
      title: 'ゼロデイを突きペイロード送り込み',
      description: 'ブラウザ/プラグインの脆弱性を突き、マルウェア(dropper)を被害端末へ送り込む。',
      run: (stage) => {
        stage.flashActor('exploit', 'shake', 800);
        stage.sendPacket('exploit', 'payload', { duration: 900, payload: 'dropper.exe' });
        stage.after(900, () => stage.sendPacket('payload', 'victim', { duration: 1000, payload: '自動DL+実行' }));
      }
    },
    {
      title: '感染端末がC&Cとビーコン',
      description: '感染が成立した端末はバックグラウンドでC&Cと通信を始め、追加の指示や情報送信を行う。',
      run: (stage) => {
        stage.flashActor('victim', 'shake', 1000);
        stage.sendPacket('victim', 'cnc', { duration: 1100, payload: 'beacon' });
      }
    }
  ],
  beginner: {
    summary:
      'いつものWebサイトを開いただけで、勝手にウイルスをダウンロードされて自動でインストールされてしまう攻撃。',
    appliesIf: [
      { head: '外部の広告タグや分析タグを埋め込んでいる:', body: 'Google Analytics 以外の小さなSaaSタグや、広告配信タグの中に攻撃が混ざることがあります。' },
      { head: 'WordPress などのCMSで運営している:', body: 'プラグインが古いまま放置されると、改ざんで攻撃配信元にされやすい筆頭です。' },
      { head: 'サブドメインがいくつもあって認証を共有している:', body: '1つのサブドメインが改ざんされると、関連する全部に被害が広がります。' },
      { head: '埋め込み外部コンテンツに `sandbox` や `integrity` を付けていない:', body: '外部ファイルの権限を絞ったり、中身が変わっていないか自動チェックする仕組みが無いと、攻撃の侵入路になります。' },
      { head: 'CSP(読み込み元の制限ヘッダ)を設定していない:', body: '改ざんされた時に任意の外部スクリプトを動かされてしまいます。' }
    ],
    caseStudy:
      '攻撃者にこっそり改ざんされた正規サイトや、汚染されたネット広告(Malvertising と呼びます)を経由して、ページを開いただけでブラウザの弱点を突かれ、ウイルスが自動的にダウンロード・実行される事案が今も続いています。',
    damage: [
      {
        head: 'ウイルス感染:',
        body: '銀行情報を盗むタイプ、行動を覗き見るタイプ、ファイルを暗号化して身代金を要求するタイプなど、各種ウイルスが知らないうちに入ります。'
      },
      {
        head: '保存情報の流出:',
        body: 'ブラウザに保存したパスワード・クッキー・暗号通貨ウォレットを抜き取られます。'
      },
      {
        head: '攻撃の踏み台にされる:',
        body: '感染端末が攻撃者のネットワーク(ボットネット)の手駒にされたり、社内ネットワークへの侵入の足場にされます。'
      },
      {
        head: '広告経由で被害が拡散:',
        body: '正規のサイトでも、配信される広告が汚染されているだけで被害が一気に広がります。'
      }
    ],
    defense: [
      {
        head: 'ブラウザ・OSを最新に保つ:',
        body: '自動更新を有効にしておけば、新しい弱点(ゼロデイ)が見つかってもすぐ穴がふさがれます。'
      },
      {
        head: 'ウイルス対策ソフト/EDRを入れる:',
        body: '怪しいダウンロードや不審な振る舞いを検知して止めるソフトを入れます。'
      },
      {
        head: '広告ブロック / DNSフィルタ:',
        body: '怪しいドメインへの接続自体を端末側で遮断する仕組みを使います。'
      },
      {
        head: 'ブラウザの保護機能を有効化:',
        body: 'Windows の SmartScreen、Chrome の Safe Browsing など、危ないサイトを警告する機能をオンに。'
      },
      {
        head: '日常作業は管理者権限で行わない:',
        body: 'ウイルスはログイン中のユーザの権限で動きます。普段使いのアカウントを管理者権限にしないだけで被害が小さくできます。'
      }
    ],
    devNote: [
      {
        head: '外部の JS/CSS には改ざん検知を付ける(SRI):',
        body: '`<script integrity="sha384-..." src="https://cdn..."/>` のように、ファイルの中身が変わったら読み込まないようにする仕組み(Subresource Integrity)を使います。'
      },
      {
        head: 'CSPで読み込み元を絞る:',
        body: 'CSP(コンテンツの読み込み制限ヘッダ)で、自分のサイトに読み込んでよい JS / 画像のドメインを限定します。広告経由の改ざんの影響を絞れます。'
      },
      {
        head: '広告タグや埋め込みSDKは継続して評価:',
        body: '一度入れたら終わりにせず、配信元の信頼性を継続して見直します。'
      },
      {
        head: 'iframe には sandbox 属性:',
        body: '外部コンテンツを iframe で埋め込むときは `sandbox` 属性を付けて、その中で実行できることを最小限に絞ります。'
      },
      {
        head: '改ざん時の手順を準備:',
        body: 'もし改ざんを検知したらどう CDN のキャッシュを消すか、利用者にどう告知するか、手順書(Runbook)を事前に作っておきます。'
      }
    ],
    steps: [
      {
        title: '利用者がいつもの正規サイトを開く',
        description:
          '利用者は普段通りのサイトを開きます。が、そのサイトは攻撃者にこっそり改ざんされています。'
      },
      {
        title: '裏で攻撃用サイトに自動転送',
        description:
          '改ざんされたページに仕込まれたプログラムが、利用者のブラウザを攻撃者のサイト(Exploit Kit と呼ばれる攻撃道具一式)へリダイレクトさせます。'
      },
      {
        title: 'ブラウザの弱点を突いてウイルスを送り込む',
        description:
          '攻撃道具がブラウザやプラグインの弱点を突いて、ウイルス本体を被害者の端末に自動的にダウンロード・実行させます。'
      },
      {
        title: '感染端末が裏で攻撃者と通信を始める',
        description:
          '感染が成立すると、端末は裏で攻撃者の指令サーバ(C&C)と通信して、追加指示を受けたり情報を送り出したりします。'
      }
    ],
    actorLabels: {
      victim: '利用者',
      site: 'こっそり改ざんされたサイト',
      exploit: '攻撃道具一式 (Exploit Kit)',
      payload: 'ウイルス本体',
      cnc: '攻撃者の指令サーバ'
    },
    groupLabels: {
      'attacker-infra': '攻撃者の道具'
    },
    connectionLabels: {
      redirect: '裏で自動転送',
      drop: 'ウイルスを配布'
    }
  }
};
