# Relay Baton Analyzer

Vercel/GitHub 公開用の最新版です。

## 重要

このZIPでは、VercelがOpenAI内部のnpmレジストリを参照しないように `package-lock.json` を削除しています。GitHubにアップロードする際は、古い `package-lock.json` が残っていない状態にしてください。

トップ階層に以下がある構成でアップロードしてください。

- package.json
- index.html
- src/main.jsx
- src/App.jsx
- .npmrc

## 更新内容

- PDF出力を廃止し、縦長PNG画像保存へ変更
- 動画アップロード後にコマ指定エリアへ自動スクロール
- 動き出しコマを最初、バトンパス完了コマを13番目に変更
- 理論値欄を簡略化
- グラフ下に交点との差、出方調整、マーク位置アドバイスを追加
