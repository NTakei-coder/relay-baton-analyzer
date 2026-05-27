# Relay Baton Analyzer

Vercel公開用の安定版です。

## Vercelでの設定

- Framework Preset: Vite
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist
- Node.js Version: 20.x

## 注意

前のビルドで `npm error Exit handler never called!` が出た場合は、npm自体または依存関係インストール時の問題です。この版では以下を固定しています。

- Node.js: 20.x
- npm: 10系
- Vite/React/Rechartsなどの依存バージョン
- npm registry: https://registry.npmjs.org/

GitHubのトップに `package.json`, `package-lock.json`, `.nvmrc`, `.npmrc`, `src/` が見える状態でアップロードしてください。
