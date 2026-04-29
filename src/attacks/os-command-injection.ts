import type { AttackDefinition } from '../types';
import { runSequence } from '../lib/Stage';
import { AttacksMeta } from '../data/attacks';

const meta = AttacksMeta.find((a) => a.slug === 'os-command-injection')!;

export const osCommandInjection: AttackDefinition = {
  meta,
  caseStudy:
    '入力値をシェルに渡す処理(画像変換ツール、pingツール、PDF生成、メール送信のsendmail呼び出し等)を踏み台に、サーバの任意コマンドを実行させ機密ファイルを取得・遠隔操作される事案が継続発生。Apache Struts などのフレームワーク脆弱性経由でも頻発。',
  damage: [
    { head: '任意コマンド実行:', body: 'rm/curl/nc 等を実行されサーバが完全に乗っ取られる。' },
    { head: '機密ファイル流出:', body: '設定ファイル/秘密鍵/.env を読み出され二次被害につながる。' },
    { head: 'バックドア設置:', body: 'リバースシェルやcron仕込みで継続的に制御される。' },
    { head: '横展開:', body: '取得したクレデンシャルで他サーバに侵入される。' }
  ],
  defense: [
    { head: 'シェルを介在させない:', body: 'execv系API/言語標準ライブラリで引数配列として渡し、shell=Falseを徹底。' },
    { head: '入力値の厳格な検証:', body: 'ホワイトリスト方式で許容文字を限定。"; | & $ ` " などを排除。' },
    { head: '最小権限実行:', body: 'WebアプリプロセスはOSの専用ユーザで動かし、書込/実行範囲を限定。' },
    { head: 'コンテナ/サンドボックス:', body: '影響範囲を限定し、横展開を抑止。' }
  ],
  devNote: [
    { head: '"system()" 系API禁止:', body: 'system()/popen()/exec()を文字列で呼び出さない。設計レビューで弾く。' },
    { head: '画像/PDF変換ツールに注意:', body: 'ImageMagick/ffmpeg/wkhtmltopdf 等は引数経由でコマンド実行に繋がる脆弱性が多い。' },
    { head: 'ファイル名のシェル渡し:', body: 'アップロードファイル名/パスを直接シェルに渡さない。UUID 等に置換する。' },
    { head: '依存ツールのCVE監視:', body: '同梱バイナリ/CLIツールの脆弱性も対象。SBOMで把握する。' },
    { head: '構造化ログ:', body: 'コマンド実行の全引数を構造化ログに残し、異常検知できるようにする。' }
  ],
  setup(stage) {
    stage.addActor('attacker', { pict: 'attacker', pos: { x: 0.10, y: 0.5 },  label: '攻撃者' });
    stage.addActor('app',      { pict: 'server',   pos: { x: 0.45, y: 0.5 },  label: 'Webアプリ' });
    stage.addActor('os',       { pict: 'server',   pos: { x: 0.78, y: 0.30 }, label: 'OSシェル' });
    stage.addActor('files',    { pict: 'document', pos: { x: 0.78, y: 0.78 }, label: '/etc/passwd 等' });

    return () => {
      stage.status('攻撃シナリオ再生中…');
      runSequence(stage, [
        { run: () => {
          stage.status('入力欄に "; cat /etc/passwd" を投入');
          stage.sendPacket('attacker', 'app', { duration: 800, payload: '; cat /etc/passwd' });
        }, hold: 900 },
        { run: () => {
          stage.status('アプリが文字列連結でシェル呼び出し');
          stage.sendPacket('app', 'os', { duration: 700, payload: 'sh -c "ping … ; cat …"' });
        }, hold: 800 },
        { run: () => {
          stage.flashActor('os', 'shake', 600);
          stage.sendPacket('os', 'files', { duration: 500, className: 'benign', payload: 'read' });
        }, hold: 700 },
        { run: () => {
          stage.sendPacket('files', 'attacker', { duration: 1100, payload: '/etc/passwd 内容' });
          stage.status('機密情報が攻撃者へ流出');
        }, hold: 1200 },
        { run: () => stage.status('攻撃完了: シェル介在禁止 + 引数配列 + 最小権限で防御') }
      ]);
    };
  }
};
