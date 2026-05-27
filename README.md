# Relay Baton Analyzer

リレーのバトンパス分析用Webアプリです。

## 主な機能

- 動画アップロード
- コマ送りによるフレーム指定
- 30m/40mバトンタイム算出
- 出のタイミング評価
- バトンパス完了位置の推定
- 理論上の最高バトンタイム推定
- 結果全体の縦長PNG画像保存

## ローカル確認

```bash
npm install
npm run dev
```

## ビルド確認

```bash
npm run build
npm test
```

## Vercel公開

GitHubにアップロード後、Vercelで以下の設定にします。

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist
- Node.js Version: 20.x

## 注意

動画はブラウザ内で読み込むだけで、サーバーには保存されません。
