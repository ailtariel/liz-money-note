# Liz Money Note

Liz Money Note 是一个本地优先的个人记账应用。它以账本、账户、流水、Tag 和周期事件为核心，Web 端使用 IndexedDB 持久化 SQLite，Android 端使用应用私有目录中的原生 SQLite；日常记账不依赖远端服务。

## 当前能力

- 管理账本、账户、Tag、收入与支出流水。
- 编辑流水时同步修正账户余额和 Tag 关联。
- 按时间、账户和分类查看趋势、收支占比与资产信息。
- 管理周期事件、默认账本、最近账户、默认币种和主题。
- 从 CSV / TXT 导入流水，并通过 JSON 导出或恢复应用数据。
- 在 Android 中检查 GitHub Release、提示新版本并安装 APK。
- 支持简体中文和英文界面。

## 技术栈

- Vue 3、TypeScript、Pinia、Vue Router、Vuetify
- Vite 8 / Rolldown
- ECharts
- Capacitor 8、`@capacitor-community/sqlite`、`jeep-sqlite`
- Android Gradle Plugin、Java 21

## 本地开发

### 环境要求

- Node.js 22（GitHub Actions 使用的版本）
- npm
- SQLite CLI 3
- Android 开发额外需要 Java 21 和 Android SDK

安装依赖：

```bash
npm ci
```

在被 Git 忽略的 `.env.local` 中配置当前机器的 SQLite 路径和开发种子库。例如 Windows：

```env
DB_SQLITE_PATH=C:\Software\SQLite\sqlite3.exe
DB_LOCAL_PATH=.local/databases/liz_money_note.db
```

启动开发服务器：

```bash
npm run dev
```

默认端口由 `.env` 的 `VITE_PORT` 控制。开发服务器启动时会：

1. 创建或迁移 `DB_LOCAL_PATH` 指向的开发种子库，不删除其中已有业务数据。
2. 将种子库同步到 `DB_ASSET_DIR`，供 Web SQLite 首次初始化使用。
3. 监听环境文件和数据库 schema；相关文件改变时重新同步并刷新页面。

应用运行后的数据写入 Web IndexedDB，不会回写 `.local` 或 `public` 中的数据库文件。已有 IndexedDB 运行时库也不会因种子文件变化而自动覆盖。

## 数据库边界

| 位置 | 所有者与用途 | 生命周期 |
| --- | --- | --- |
| `.local/databases/<name>.db` | 本地开发种子库 | `npm run dev` 增量应用 schema，并保留业务数据 |
| `public/assets/databases/<name>.db` | Web / Android 初始化用的生成资产 | 开发时从种子库同步；生产构建时替换为全新空结构库 |
| 浏览器 `jeepSqliteStore` IndexedDB | Web 运行时数据库 | 应用读写和持久化发生在这里 |
| Android 应用私有 SQLite 目录 | Android 运行时数据库 | 首次启动从 assets 复制，之后只在私有目录读写 |

`public/assets/databases` 不是运行时数据目录，不应手工维护或放入验证数据库。生产构建会清理多余 `.db` 文件，只保留当前配置的数据库和 `databases.json`。

如果 Windows 上的构建报告数据库文件 `EBUSY`，先关闭正在查看 `public/assets/databases/*.db` 的 SQLite 查看器或编辑器标签页；构建需要替换该生成文件。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 准备开发种子库并启动 Vite |
| `npm run typecheck` | 运行 Vue / TypeScript 类型检查 |
| `npm run build` | 生成空结构数据库资产并构建生产 Web 资源 |
| `npm run preview` | 本地预览 `dist` |
| `npm run cap:sync:android` | 将 Web 产物和 Capacitor 配置同步到 Android 工程 |
| `npm run db:generate-empty` | 单独生成生产用空结构数据库资产 |
| `npm run db:generate-empty:dev` | 单独迁移并同步开发种子库 |
| `npm run db:generate-preload` | 生成显式预载数据的数据库资产 |

提交代码前至少运行：

```bash
npm run typecheck
npm run build
```

## Android Debug APK

先构建 Web 资源并同步 Capacitor：

```bash
npm run build
npm run cap:sync:android
```

然后在 Windows 上构建 Debug APK：

```powershell
cd android
.\gradlew.bat assembleDebug
```

产物位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

## GitHub Android Release

推送 `v<version>` 格式的 tag 会触发 `.github/workflows/android-apk-release.yml`：

```bash
git tag v1.2.3
git push origin v1.2.3
```

工作流会执行类型检查、Web 构建、Capacitor 同步、Release APK 签名和校验，并把 APK 与 SHA-256 文件发布到 GitHub Release。`versionName` 来自 tag，`versionCode` 来自 GitHub Actions run number。

仓库需要配置以下 Actions secrets：

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

应用通过 `APP_UPDATE_MANIFEST_URL` 查询最新 GitHub Release；首次检测到更高版本时弹出提示，About 页同时保留更新红点和手动检查入口。

## 环境变量

- `VITE_*`：本地开发服务器端口和 API / Auth 代理，仅由 Vite 使用。
- `APP_*`：客户端运行时配置；双下划线表示嵌套，例如 `APP_FEATURE_FLAGS__SHOW_ABOUT`。
- `DB_*`：构建期数据库名、文件、路径、版本和加密模式，不暴露给客户端环境变量。
- `BUILD_APP_VERSION`：构建时写入应用的版本号；Release 工作流会自动设置。
- `NG_*`：仓库中 Nginx 模板使用的容器变量。

默认值见 [`.env`](.env)，本机覆盖写入 `.env.local`，不要提交 `.env.local`。生产容器运行时的 `APP_*` 会生成 `public/config/env-config.json`；新增运行时 key 时，需要先让构建期模板包含该 key。

## 目录结构

```text
src/modules/                 业务模块与 Pinia stores
src/components/              通用组件和应用布局
src/core/                    运行时配置、API 与认证基础设施
src/router/                  路由和页面标题
scripts/                     数据库与运行时配置生成脚本
public/assets/databases/     生成的数据库运输资产
android/                     Capacitor Android 工程
docs/design/                 功能、数据和视觉设计
docs/implementation logs/    逐次实施计划与验证记录
AI-coding-specification/     仓库级 AI 开发约束
```

详细产品与数据约束见：

- [应用实施细节](docs/design/app-implementation-details.md)
- [基础数据设计](docs/design/basic-data-design.md)
- [样式设计系统](docs/design/style-design-system.md)
- [当前迭代路线图](docs/implementation%20logs/2026-08-01%20project-iteration-roadmap.md)

仓库仍保留 Docker、Nginx 和 Helm 配置，但当前持续验证和发布主链路是本地 Vite 开发与 Android APK；将容器配置用于生产前应单独完成部署验收。
