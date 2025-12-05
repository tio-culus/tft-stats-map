# TFT Stats Map

TFT (Teamfight Tactics) のUnitの性能を比較するためのツールです。

## 使い方

### ローカルサーバーの起動

```bash
python -m http.server 8080
```

ブラウザで http://localhost:8080/view_champions.html を開きます。

### 機能

- **Table View**: チャンピオン一覧をテーブル形式で表示
- **Durability Map**: HP vs AR/MR の耐久性マップを表示
- **フィルタ**: Cost, Traits, Role でフィルタリング
- **バージョン選択**: 過去のパッチバージョンを切り替え可能

---

## データ更新方法

新しいパッチがリリースされた場合、以下の手順でデータを更新します。

### 1. 最新データのダウンロード

CommunityDragon からSet16のデータを取得します。

```powershell
# Set16のデータ（日本語）
Invoke-WebRequest -Uri "https://raw.communitydragon.org/latest/cdragon/tft/ja_jp.json" -OutFile ".\tft-cdragon.json"
```

### 2. Set16データの抽出

`tft-cdragon.json` からSet16のチャンピオンデータを抽出します。

```bash
node filter_champions.js
```

これにより `set16.json` が生成されます。

### 3. バージョン付きデータの作成

バージョン番号を指定してデータを抽出し、保存します。

```bash
# 例: パッチ15.24.1のデータ
node extract_set16.js 15.24.1

# 例: パッチ15.25.0のデータ  
node extract_set16.js 15.25.0
```

これにより以下が作成/更新されます:
- `data/set16_v{version}.json` - バージョン付きデータ
- `set16_champions.json` - 最新版（後方互換用）
- `versions.json` - バージョン一覧

### 4. 確認

ブラウザでページをリロードすると、サイドバーのバージョンセレクタから新しいバージョンを選択できるようになります。

---

## ファイル構成

```
📁 data/                    # バージョン別データ
   ├── set16_v15.24.1.json
   └── set16_v15.25.0.json
📁 icons/                   # チャンピオンアイコン
📄 versions.json            # バージョン一覧
📄 set16_champions.json     # 最新データ（後方互換用）
📄 view_champions.html      # メインUI
📄 extract_set16.js         # データ抽出スクリプト
📄 filter_champions.js      # Set16フィルタスクリプト
```

---

## メモ

### DDragon API (参考)

```powershell
Invoke-WebRequest -Uri "https://ddragon.leagueoflegends.com/cdn/15.24.1/data/ja_JP/tft-champion.json" -OutFile ".\tft-champion.json"
```
