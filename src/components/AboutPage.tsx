import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  useEffect(() => {
    document.title = 'このアプリについて - Cyber Attack Visualization';
    return () => { document.title = 'Cyber Attack Visualization'; };
  }, []);

  return (
    <div className="about-page">
      <main className="container">
        <div className="crumbs">このアプリについて</div>

        <section className="about-hero">
          <h2>このアプリは何か</h2>
          <p>
            代表的なサイバー攻撃の手口を、ピクトグラム × ステップアニメーションで可視化し、
            被害例・対策・開発上の注意点までを 1 ページで読み切れるカタログです。
            「専門家向け」と「やさしい解説」のレベルを切り替えながら、自分の知識量に合った深さで学べます。
          </p>
        </section>

        <section className="about-section">
          <h2>作った動機・背景</h2>
          <p>
            ChatGPT や Claude のような AI に手伝ってもらいながらコードを書く流れ
            (バイブコーディング) が広がり、誰でも数日でアプリをインターネットに公開できる時代になりました。
            一方で、認証・データベース・外部 API・LLM といった「危険な部品」を、
            攻撃の存在を知らないまま組み合わせてしまう事故が増えています。
          </p>
          <blockquote className="about-pullquote">
            プロダクトには、責任と脆弱性が必ずつきまとう。
            <br />
            その存在を知っておくだけで、あなたの何かが変わるかもしれない。
          </blockquote>
          <p>
            Web3 や AI の世界に踏み込んでいくとき、この前提はますます重要になります。
            自分のサービスを守る人は、最終的には自分自身です。
            このアプリは、攻撃の名前と形を「最初に出会う場所」として置いておくために作りました。
          </p>
        </section>

        <section className="about-section">
          <h2>想定読者</h2>
          <ul className="about-list">
            <li>
              <strong>バイブコーディングで初めてアプリを公開してみた人 — </strong>
              認証フォームや DB を使い始めたものの、何が危ないのかピンと来ていない方。
            </li>
            <li>
              <strong>フロントエンド中心で書いてきた開発者 — </strong>
              バックエンドや認証まわりに踏み込もうとしている方。
            </li>
            <li>
              <strong>セキュリティを学び始めた学生・新人エンジニア — </strong>
              個別の用語は聞いたことがあるけれど、攻撃が成立する流れを掴みたい方。
            </li>
            <li>
              <strong>AI を使ったプロダクトを開発している人 — </strong>
              プロンプトインジェクションやモデル抽出など、生成 AI 特有の弱点を整理したい方。
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>使い方</h2>
          <ol className="about-list">
            <li>
              <strong>レベルを選ぶ — </strong>
              ページ右上のトグルで「専門家向け / やさしい解説」を切り替え。途中で何度でも変えられます。
            </li>
            <li>
              <strong>カテゴリから 1 つ選ぶ — </strong>
              Web / 不特定多数 / 特定組織 / 認証 / AI の 5 カテゴリに分かれています。気になるカードをクリック。
            </li>
            <li>
              <strong>「該当する機能」を最初に確認 — </strong>
              詳細ページの最上段に、その攻撃が自分のアプリに当てはまるかを判断するチェックリストがあります。
            </li>
            <li>
              <strong>「次へ」でアニメーションを 1 ステップずつ進める — </strong>
              攻撃の流れが時系列で再生され、最終ステップで「結果」が表示されます。
            </li>
            <li>
              <strong>下の被害事例 / 対策 / 開発上の注意 を読む — </strong>
              心当たりがあれば、対策セクションを読んで該当箇所を見直しに行けます。
            </li>
          </ol>
        </section>

        <section className="about-section">
          <h2>クレジット・出典</h2>
          <ul className="about-list about-credits">
            <li><strong>OWASP Top 10 — </strong>Web アプリケーションの代表的なリスクの分類。本アプリのカテゴリ設計に参考。</li>
            <li><strong>OWASP Top 10 for LLM Applications — </strong>生成 AI 特有の脆弱性カテゴリ(Prompt Injection / Model Theft 等)。</li>
            <li><strong>IPA「情報セキュリティ10大脅威」 — </strong>国内インシデントの傾向と被害事例。</li>
            <li><strong>各攻撃の「代表的な被害事例」 — </strong>各攻撃ページ内に個別出典を記載。</li>
            <li><strong>ピクトグラム — </strong>ISO 風スタイルで本プロジェクトのオリジナル。SVG ベース。</li>
          </ul>
        </section>

        <div className="about-back">
          <Link to="/">← カタログへ戻る</Link>
        </div>
      </main>
    </div>
  );
}
