import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'csrf')!;

export const csrf: AttackDefinition = {
  meta,
  caseStudy:
    '2005年 mixi の "ぼくはまちちゃん!" 事件、2012年 遠隔操作ウイルス事件で掲示板に書き込ませた踏み台URLなど、ログイン中の利用者に意図しない投稿/設定変更を行わせる事案が国内外で多数発生している。',
  damage: [
    { head: '意図しない投稿/送金:', body: 'SNS書込・退会・パスワード変更・送金などを本人名義で実行されてしまう。' },
    { head: '管理画面の操作:', body: '管理者がログイン中に罠ページを開くと権限変更などを誘発される。' },
    { head: 'IoT機器の改ざん:', body: 'ローカルネットのルータ管理画面に対するCSRFで設定が書き換えられる事例も。' }
  ],
  defense: [
    { head: 'CSRFトークン:', body: 'フォーム/APIに使い捨てのトークンを必須化し、サーバ側で検証する。' },
    { head: 'SameSite Cookie:', body: 'セッションCookieに SameSite=Lax 以上を設定し、外部サイトからの送信を抑止。' },
    { head: 'Origin/Referer検証:', body: 'POSTやAPIで送信元を検証し、外部Originからのリクエストを拒否。' },
    { head: '重要操作には再認証:', body: 'パスワード変更・送金などはパスワード再入力やMFAを必須化。' }
  ],
  devNote: [
    { head: 'GETで状態変更しない:', body: 'リンク踏ませただけで何かが変わる作りはNG。状態変更はPOST/PUT/DELETEに統一。' },
    { head: 'CORSとCSRFは別物:', body: 'CORSが効くのはJSのfetch等。フォームsubmitは制限されないため別途対策が必要。' },
    { head: 'JSON APIも油断しない:', body: 'Content-Type: text/plain や multipart/form-data で送ると "シンプルリクエスト" 扱いで届くことがある。' },
    { head: 'フレームワーク機能を使う:', body: 'Rails/Laravel/Django/Spring等は標準でCSRF対策を持つ。"自前実装" を避ける。' },
    { head: 'モバイルAPIのトークン:', body: 'Cookie認証ではなくAuthorizationヘッダにすればCSRFリスクは大幅減。' }
  ],
  setup(stage) {
    stage.addGroup({ x: 0.02, y: 0.04, w: 0.50, h: 0.36, label: '罠ドメイン', variant: 'attack' });
    stage.addGroup({ x: 0.02, y: 0.60, w: 0.50, h: 0.36, label: '被害者側', variant: 'victim' });
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.20 }, label: '攻撃者' });
    stage.addActor('trap',     { pict: 'browser',  pos: { x: 0.40, y: 0.20 }, label: '罠サイト' });
    stage.addActor('victim',   { pict: 'user',     pos: { x: 0.10, y: 0.78 }, label: '被害者(ログイン中)' });
    stage.addActor('vbrowser', { pict: 'browser',  pos: { x: 0.40, y: 0.78 }, label: '被害者ブラウザ' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.85, y: 0.5  }, label: '正規サービス' });
    stage.addConnection('vbrowser', 'app', { variant: 'flow', dashed: true, label: 'Cookie保持中' });
  },
  steps: [
    {
      title: '罠サイトを設置',
      description: '攻撃者が、隠しフォームや<img>に正規サイトへのリクエストを仕込んだ罠ページを公開する。',
      run: (stage) => {
        stage.sendPacket('attacker', 'trap', { duration: 1000, payload: '<form action=正規 …>' });
      }
    },
    {
      title: '被害者が正規サービスにログイン中',
      description: '被害者は別タブで正規サービスにログインしていて、ブラウザはCookieを保持している。',
      run: (stage) => {
        stage.sendPacket('victim', 'vbrowser', { duration: 800, className: 'benign', payload: '正規ログイン済' });
      }
    },
    {
      title: '罠ページを閲覧してしまう',
      description: 'メールやSNSのリンクから罠ページを開いてしまう。',
      run: (stage) => {
        stage.sendPacket('vbrowser', 'trap', { duration: 1000, className: 'benign', payload: 'GET 罠ページ' });
      }
    },
    {
      title: '罠ページが正規サービスに自動POST',
      description: '罠ページのJSが正規サービスにリクエストを発行し、ブラウザはCookieを同送してしまう。',
      run: (stage) => {
        stage.sendPacket('vbrowser', 'app', { duration: 1300, payload: 'POST /transfer (+Cookie)' });
      }
    },
    {
      title: '正規サービスは本人操作と誤認',
      description: 'Cookieが付いているため、正規サービスは"本人の操作"として処理してしまう。CSRFトークン+SameSiteで防御可能。',
      run: (stage) => {
        stage.flashActor('app', 'shake', 1000);
      }
    }
  ]
};
