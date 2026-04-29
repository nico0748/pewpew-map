import type { AttackDefinition } from '../types';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'mfa-fatigue')!;

export const mfaFatigue: AttackDefinition = {
  meta,
  caseStudy:
    '2022年 Uber と Cisco が同種の手口で侵害された。攻撃者は事前に入手した正規パスワードを使ってMFAプッシュ通知を連続して被害者に飛ばし、最終的にユーザーが煩わしくなって誤承認、もしくは "IT部門を装ったSlack/SMSの誘導" を受けて承認してしまうことで突破された。番号マッチング(Number Matching)導入前のプッシュ通知型MFAの構造的弱点を突いた攻撃として広く知られる。',
  damage: [
    { head: '社内システム侵入:', body: '正規ユーザーのMFAをすり抜けてVPN/ID基盤に侵入され、横展開される。' },
    { head: '管理者乗っ取り:', body: '管理者承認が通るとIDPやSSOテナントが奪われる。' },
    { head: '長期侵害の起点:', body: 'APT/ランサムウェア攻撃の初期アクセスとして繰り返し悪用される。' },
    { head: 'インシデント検知の遅延:', body: '"認証ログ上は本人成功" のため検知が遅れる。' }
  ],
  defense: [
    { head: '番号マッチング(Number Matching):', body: 'プッシュ通知に2桁数字を表示しユーザーに入力させる。誤承認を物理的に困難に。' },
    { head: 'プッシュ通知から TOTP/Passkey へ:', body: 'プッシュ承認のみのMFAから、ハードウェアキー / FIDO2 / Passkey 中心へ移行。' },
    { head: '条件付きアクセス:', body: '不審IP/未登録端末/海外ASN等のリクエストはMFA成功後でも追加検証。' },
    { head: 'プッシュ頻度の制限:', body: '一定時間内のプッシュ送出数を上限化し、攻撃の連打を遮断。' },
    { head: 'ヘルプデスク詐称対策:', body: 'IT部門と称する電話/Slackは "コールバック必須" 等のフロー徹底。' }
  ],
  devNote: [
    { head: '"承認" は無音で簡単すぎないか:', body: '通知UIで承認ボタンを大きく押せる設計は誤承認を誘発する。番号入力やバイオ認証を挟む。' },
    { head: 'ログ設計:', body: 'プッシュの送出回数 / 拒否数 / 短時間の連続要求 を構造化ログに残し、SIEMで早期検知。' },
    { head: 'ユーザー教育の限界:', body: '"おかしいと思ったら拒否してね" だけに頼らず、技術的に誤承認を起こさせない設計を優先する。' },
    { head: '従業員向けエンドポイント:', body: 'モバイルとPCで同時にプッシュが来る環境では誤承認しやすい。優先端末を明確化する。' },
    { head: '休暇/夜間の運用:', body: '深夜帯のプッシュは特に意図しない承認が起きやすい。時間帯ベースの追加検証を入れる。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 }, label: '攻撃者' });
    stage.addActor('idp',      { pict: 'server',   pos: { x: 0.40, y: 0.5 }, label: 'IDプロバイダ' });
    stage.addActor('phone',    { pict: 'browser',  pos: { x: 0.65, y: 0.5 }, label: '被害者スマホ' });
    stage.addActor('user',     { pict: 'user',     pos: { x: 0.90, y: 0.5 }, label: '被害者' });
  },
  steps: [
    {
      title: '正規ID/PWでログイン試行',
      description: '攻撃者が事前に入手した認証情報でログインを試みる。',
      run: (stage) => {
        stage.sendPacket('attacker', 'idp', { duration: 1000, payload: '正規ID/PW' });
      }
    },
    {
      title: 'MFAプッシュが大量に飛ぶ',
      description: '攻撃者は何度もログインを繰り返し、被害者のスマホにプッシュ通知が連続で届く。',
      run: (stage) => {
        for (let i = 0; i < 6; i++) {
          stage.after(i * 280, () => stage.sendPacket('idp', 'phone', { duration: 600, payload: 'MFA push' }));
        }
      }
    },
    {
      title: '被害者が"うっかり"承認',
      description: '通知の煩わしさやIT部門を装った誘導を受けて、被害者が誤って承認してしまう。',
      run: (stage) => {
        stage.flashActor('user', 'shake', 800);
        stage.sendPacket('user', 'phone', { duration: 700, className: 'benign', payload: 'Approve' });
        stage.after(700, () => stage.sendPacket('phone', 'idp', { duration: 700, className: 'benign', payload: 'approved' }));
      }
    },
    {
      title: '攻撃者が認証通過',
      description: '攻撃者は本人扱いでログイン成功し、社内システムへの足場を得る。番号マッチング/Passkey 移行で防御可能。',
      run: (stage) => {
        stage.flashActor('idp', 'shake', 800);
        stage.sendPacket('idp', 'attacker', { duration: 1000, payload: 'session token' });
      }
    }
  ]
};
