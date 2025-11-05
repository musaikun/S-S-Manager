# S×S Manager システム仕様書

## 1. プロジェクト概要

### 1.1 プロジェクト名
**S×S Manager** (エスバイエス マネージャー)

### 1.2 概要
S×S Managerは、シフト管理を効率化するためのWebアプリケーションです。ユーザーは直感的なカレンダーインターフェースを通じて勤務可能な日付を選択し、各日の勤務時間を登録することができます。

### 1.3 バージョン
0.0.1-SNAPSHOT (開発初期段階)

### 1.4 開発組織
- **グループID**: com.example
- **アーティファクトID**: S-SManager

---

## 2. 技術スタック

### 2.1 バックエンド
| 技術 | バージョン | 用途 |
|------|----------|------|
| Java | 21 | プログラミング言語 |
| Spring Boot | 3.5.7 | Webアプリケーションフレームワーク |
| Spring Web | - | RESTコントローラとHTTPサポート |
| Thymeleaf | - | サーバーサイドテンプレートエンジン |
| Lombok | - | ボイラープレートコード削減 |
| Spring Boot DevTools | - | 開発時のライブリロード |
| Maven | - | ビルド・依存関係管理 |

### 2.2 フロントエンド
- **HTML5**: マークアップ
- **CSS3**: スタイリング（アニメーション含む）
- **JavaScript (ES6+)**: クライアントサイドロジック

### 2.3 テスト
- **JUnit 5 (Jupiter)**: ユニットテストフレームワーク
- **Spring Boot Test**: Spring統合テスト

---

## 3. システムアーキテクチャ

### 3.1 ディレクトリ構成

```
S-S-Manager/
├── pom.xml                                    # Mavenプロジェクト設定
├── mvnw, mvnw.cmd                             # Maven Wrapper
├── .mvn/                                      # Maven Wrapper設定
├── README.md                                  # プロジェクト説明
├── SPEC.md                                    # 本仕様書
└── src/
    ├── main/
    │   ├── java/com/example/ss/
    │   │   ├── SSManagerApplication.java      # アプリケーションエントリーポイント
    │   │   └── controller/
    │   │       ├── IndexController.java       # インデックスコントローラ（スタブ）
    │   │       ├── calendar/
    │   │       │   └── CalendarController.java      # カレンダー画面制御
    │   │       └── timeregister/
    │   │           └── TimeRegisterController.java  # 時間登録画面制御
    │   └── resources/
    │       ├── application.properties         # アプリケーション設定
    │       ├── static/                        # 静的リソース
    │       │   ├── index.css                  # トップページスタイル
    │       │   ├── index.js                   # トップページスクリプト
    │       │   ├── css/
    │       │   │   ├── calendar_css/calendar.css
    │       │   │   └── timeregister_css/timeregister.css
    │       │   └── js/
    │       │       ├── calendar_js/calendar.js
    │       │       └── timeregister_js/timeregister.js
    │       └── templates/                     # Thymeleafテンプレート
    │           ├── index.html                 # トップページ
    │           ├── calendar_html/calendar.html
    │           └── timeregister_html/timeregister.html
    └── test/                                  # テストコード
```

### 3.2 アーキテクチャパターン
- **MVC (Model-View-Controller)**: Spring MVCパターンを採用
- **レイヤー構成**:
  - **Controller層**: HTTPリクエスト処理とビューへのデータ受け渡し
  - **View層**: Thymeleafテンプレート（HTML）
  - **Static Assets層**: CSS/JavaScript（フロントエンドロジック）

---

## 4. 機能仕様

### 4.1 画面遷移フロー

```
[トップページ] → [カレンダー選択] → [時間登録] → [確認・カレンダーへ戻る]
     ↓              ↓                   ↓
   index.html    calendar.html    timeregister.html
```

### 4.2 各画面の詳細

#### 4.2.1 トップページ (`/`)
**ファイル**:
- Controller: `CalendarController.java:15-44`
- Template: `templates/index.html`
- CSS: `static/index.css`
- JS: `static/index.js`

**機能**:
1. **タイトル表示**: "S×S Manager"をアニメーション付きで表示
2. **スタートボタン**: 「始める」ボタンでアニメーション開始
3. **アニメーション演出**:
   - タイトルの「×」が星パーティクル（40個）に分解
   - SとS2が外側へフェードアウト
   - ログインフォームがフェードイン表示
4. **ログインフォーム** (実装予定):
   - ユーザーID入力欄
   - パスワード入力欄
   - 新規登録ボタン

**リクエストパラメータ**:
- `dates` (List<String>, optional): 選択済み日付リスト (yyyy-MM-dd形式)
- `removedDates` (String, optional): 削除された日付のカンマ区切り文字列

**処理ロジック**:
1. URLパラメータから選択済み日付を復元
2. 削除された日付を除外
3. 選択済み日付をモデルに追加
4. `index.html`を返却

#### 4.2.2 カレンダー画面
**ファイル**:
- Template: `templates/calendar_html/calendar.html`
- CSS: `static/css/calendar_css/calendar.css`
- JS: `static/js/calendar_js/calendar.js`

**機能**:
- カレンダー形式での日付選択
- 複数日付の選択・解除
- 選択した日付の視覚的フィードバック
- 時間登録画面への遷移

#### 4.2.3 時間登録画面 (`/time-register`)
**ファイル**:
- Controller: `TimeRegisterController.java:24-80`
- Template: `templates/timeregister_html/timeregister.html`
- CSS: `static/css/timeregister_css/timeregister.css`
- JS: `static/js/timeregister_js/timeregister.js`

**機能**:
1. 選択した日付ごとの勤務時間入力フォーム
2. 日本語形式での日付表示（例: 11/15(金)）
3. 開始時刻と終了時刻の入力
4. シフトの削除機能

**GET `/time-register` リクエストパラメータ**:
- `dates` (List<String>, required): 選択日付リスト (yyyy-MM-dd形式)
- `removedDates` (String, optional): 削除された日付のカンマ区切り文字列

**処理ロジック**:
1. 削除された日付を除外
2. 日付をLocalDateに変換して昇順ソート
3. 各日付の表示情報を作成:
   - `date`: yyyy-MM-dd形式
   - `displayDate`: M/d(曜) 形式（日本語）
   - `dayOfWeek`: 曜日番号（0=日曜, 6=土曜）
4. モデルに日付情報リストと総日数を追加
5. `TimeRegister.html`を返却

**POST `/time-register/submit` リクエストパラメータ**:
- `dates` (List<String>): 日付リスト
- `startTimes` (List<String>): 開始時刻リスト
- `endTimes` (List<String>): 終了時刻リスト
- `removedDates` (String, optional): 削除された日付

**処理ロジック**:
1. 提出されたシフトデータをコンソールにログ出力
2. 完了メッセージをモデルに追加
3. 選択日付と削除日付をRedirectAttributesに追加
4. トップページ（`/`）へリダイレクト

---

## 5. データモデル

### 5.1 日付情報 (DateInfo)
カレンダーから時間登録画面への受け渡しで使用される情報:

| フィールド | 型 | 説明 | 例 |
|-----------|------|------|-----|
| date | String | ISO 8601形式の日付 | "2025-11-15" |
| displayDate | String | 日本語表示用日付 | "11/15(金)" |
| dayOfWeek | String | 曜日番号（0-6） | "5" (金曜) |

### 5.2 シフト提出データ
時間登録フォームから送信されるデータ:

| フィールド | 型 | 説明 |
|-----------|------|------|
| dates | List<String> | yyyy-MM-dd形式の日付リスト |
| startTimes | List<String> | HH:mm形式の開始時刻リスト |
| endTimes | List<String> | HH:mm形式の終了時刻リスト |
| removedDates | String | カンマ区切りの削除日付文字列 |

---

## 6. API エンドポイント

### 6.1 エンドポイント一覧

| メソッド | パス | 説明 | Controller |
|---------|------|------|-----------|
| GET | `/` | トップページ/カレンダー表示 | CalendarController |
| GET | `/time-register` | 時間登録フォーム表示 | TimeRegisterController |
| POST | `/time-register/submit` | シフト提出処理 | TimeRegisterController |

### 6.2 詳細仕様

#### GET `/`
**説明**: トップページを表示。選択済み日付を保持してカレンダー状態を復元。

**クエリパラメータ**:
```
?dates=2025-11-15&dates=2025-11-16&removedDates=2025-11-17
```

**レスポンス**: `index.html`テンプレート

---

#### GET `/time-register`
**説明**: 選択した日付の時間登録フォームを表示。

**クエリパラメータ** (必須):
```
?dates=2025-11-15&dates=2025-11-16&removedDates=
```

**レスポンス**: `TimeRegister.html`テンプレート

**モデル属性**:
- `dateInfoList`: List<Map<String, String>> (日付情報リスト)
- `totalDays`: Integer (選択日数)

---

#### POST `/time-register/submit`
**説明**: シフトデータを提出し、カレンダー画面にリダイレクト。

**フォームパラメータ**:
```
dates=2025-11-15&dates=2025-11-16
startTimes=09:00&startTimes=10:00
endTimes=18:00&endTimes=19:00
removedDates=
```

**レスポンス**: リダイレクト (`redirect:/`)

**処理内容**:
- 現在はコンソールログ出力のみ
- 今後の実装予定: データベース保存、LINE通知など

---

## 7. UI/UXデザイン

### 7.1 デザインコンセプト
- **モダンでクリーン**: ガラスモルフィズム風のデザイン
- **アニメーション**: 滑らかな画面遷移とインタラクション
- **日本語対応**: 全UIが日本語で統一

### 7.2 主要アニメーション

#### トップページ
1. **星の爆発エフェクト** (`index.js:41-54`):
   - 「×」記号が40個の星パーティクルに分解
   - ランダムな方向と距離で飛散
   - 1.5秒かけてフェードアウト

2. **タイトルフェードアウト** (`index.js:26-29`):
   - 「S」が左へ60px移動しながらフェード
   - 「S Manager」が右へ60px移動しながらフェード

3. **ログインフォーム表示** (`index.js:93-102`):
   - 1.6秒後にフェードイン
   - 自動的に最初の入力欄にフォーカス

### 7.3 カラースキーム
- CSS変数による統一的なカラー管理
- 曜日別カラーコーディング（土曜: 青、日曜: 赤）
- アクセシビリティを考慮したコントラスト比

---

## 8. 開発環境

### 8.1 必須環境
- **Java**: JDK 21以上
- **Maven**: 3.6以上（Mavenラッパー同梱）
- **ブラウザ**: モダンブラウザ（Chrome, Firefox, Safari, Edge）

### 8.2 ビルド・実行方法

#### ビルド
```bash
./mvnw clean package
```

#### 開発サーバー起動
```bash
./mvnw spring-boot:run
```

#### アクセスURL
```
http://localhost:8080
```

### 8.3 開発ツール
- **Spring Boot DevTools**: 自動リロード有効
- **Lombok**: アノテーションプロセッサ設定済み

---

## 9. 設定ファイル

### 9.1 application.properties
```properties
spring.application.name=S-SManager
```

### 9.2 pom.xml 主要設定
- **親POM**: spring-boot-starter-parent 3.5.7
- **Java Version**: 21
- **Packaging**: jar (デフォルト)

---

## 10. 今後の実装予定

### 10.1 認証・認可
- [ ] ユーザー登録機能
- [ ] ログイン/ログアウト
- [ ] Spring Securityの導入
- [ ] セッション管理

### 10.2 データ永続化
- [ ] データベース選定（MySQL/PostgreSQL/H2）
- [ ] Spring Data JPAの導入
- [ ] エンティティクラスの作成
- [ ] RepositoryとServiceレイヤーの実装

### 10.3 ビジネスロジック
- [ ] シフトデータのDB保存
- [ ] シフトの編集・削除機能
- [ ] シフトの承認ワークフロー
- [ ] シフト集計・レポート機能

### 10.4 外部連携
- [ ] LINE Messaging API連携
- [ ] メール通知機能
- [ ] カレンダーエクスポート（iCal形式）

### 10.5 UI/UX改善
- [ ] レスポンシブデザイン対応
- [ ] PWA化（オフライン対応）
- [ ] ダークモード対応
- [ ] 多言語対応（i18n）

### 10.6 テスト
- [ ] ユニットテストの充実
- [ ] 統合テストの追加
- [ ] E2Eテスト（Selenium/Cypress）

### 10.7 デプロイ
- [ ] CI/CDパイプライン構築
- [ ] Docker化
- [ ] クラウドデプロイ（AWS/GCP/Azure）

---

## 11. 既知の課題

### 11.1 実装上の問題
1. **IndexControllerが未実装**: スタブクラスのみで実装なし
2. **認証機能なし**: 現在は誰でもアクセス可能
3. **データ永続化なし**: シフトデータは保存されない
4. **バリデーション不足**: 入力値の検証が不十分
5. **エラーハンドリング**: 例外処理が未実装

### 11.2 パフォーマンス
- アニメーションの最適化余地あり
- 大量データ処理時の考慮が必要

### 11.3 セキュリティ
- CSRF対策の実装が必要
- XSS対策の強化
- SQLインジェクション対策（DB導入時）

---

## 12. 参考情報

### 12.1 主要ファイルパス
- **エントリーポイント**: `src/main/java/com/example/ss/SSManagerApplication.java`
- **カレンダーController**: `src/main/java/com/example/ss/controller/calendar/CalendarController.java`
- **時間登録Controller**: `src/main/java/com/example/ss/controller/timeregister/TimeRegisterController.java`
- **トップページJS**: `src/main/resources/static/index.js`

### 12.2 コード統計
- **Javaコード**: 約186行
- **コントローラ数**: 3クラス
- **HTMLテンプレート**: 3ファイル
- **JavaScriptファイル**: 3ファイル
- **CSSファイル**: 3ファイル

---

## 13. ライセンス
未定（現在は空のlicenseタグ）

---

## 14. 変更履歴

| バージョン | 日付 | 内容 |
|----------|------|------|
| 0.0.1-SNAPSHOT | 2025-11 | 初期プロジェクト作成 |

---

**最終更新**: 2025年11月5日
**作成者**: Claude (AI Assistant)
**ドキュメントバージョン**: 1.0
