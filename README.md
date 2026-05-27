# Relay Baton Analyzer

4×100mリレーのバトンパス分析用Webアプリです。

## 最新版の主な変更

- コマ選択の指示を動画の上に表示
- コマ登録ボタンをコマ送り操作の近くに配置
- 指示カードの背景色を奇数・偶数で交互に変更
- 分析情報は初期状態で空欄
- 走順は「1-2走」「2-3走」「3-4走」のプルダウン
- 「回数」を「試技回数」に変更
- 「タイミング」「遅い/速い」を削除
- 選択済みコマ一覧を最後へ移動し、手入力修正の説明を追加
- 速度比較グラフに挙手位置・完了位置の縦線を追加
- 受け手の距離−時間グラフを削除
- CSV出力をやめ、PDF出力に変更

## ローカル確認

```bash
npm install
npm run dev
```

## Vercel公開

GitHubにこのフォルダの中身をアップロードし、Vercelでデプロイします。

推奨設定:

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist
- Node.js Version: 20.x

## 注意

動画はブラウザ内で読み込むだけで、サーバーへ保存しません。
PDF出力はブラウザの印刷機能を使います。印刷画面で「PDFに保存」を選択してください。
