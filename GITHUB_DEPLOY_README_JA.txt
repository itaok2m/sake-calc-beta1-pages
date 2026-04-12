GitHub公開用セットです。

使い方（重要）
1. このZIPを展開する
2. 展開後の「sake-calc-beta1-pages_github_ready_20260412」フォルダを開く
3. その中のファイルとフォルダを、GitHubの既存 repo「sake-calc-beta1-pages」のルートへ上書きする
   ※ フォルダごと1段深く置かないこと
4. Commit して GitHub Pages の反映を待つ

今回の整理
- 未参照の .check JS を削除
- 公開本体（index.html / docs-view.html / data / images / icons / manifest.json / sw.js）は維持

注意
- GitHubに上げるのは、このフォルダ“そのもの”ではなく、中身です。
- 独自ドメイン運用中なら CNAME を消さないでください。
