# 账本软件基础功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans or equivalent task-by-task execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个本地优先的基础账本 App，支持账本、账户、Tag、收入、支出、转账和周期事件手动批准。

**Architecture:** 使用 Vue 3 + Vite 作为 Web 前端，使用 Capacitor 打包 Android APK，使用 SQLite 保存本地业务数据。业务层围绕账本、账户、流水、Tag 和周期事件组织，周期事件只生成待批准提醒，不自动写入流水。

**Tech Stack:** Vue 3, Vite, TypeScript, Pinia, Vue Router, Vuetify, Capacitor, SQLite.

---

## 范围

第一阶段实现：

- 账本管理
- 账户管理
- Tag 管理
- 收入、支出、转账流水
- 流水列表和基础筛选
- 周期事件配置
- App 打开时提示到期周期事件
- 用户手动批准或跳过周期事件
- SQLite 本地数据持久化

第一阶段不实现：

- 用户系统
- 云同步
- 跨币种转账
- 周期事件执行历史
- 附件上传
- 预算管理
- 高级统计图表

## 文件规划

实施时建议按以下边界组织文件。实际路径可根据现有项目结构微调，但职责应保持一致。

```text
src/modules/database/
  schema.ts                 SQLite 建表 SQL 和索引 SQL
  connection.ts             SQLite 初始化和连接管理
  migrations.ts             数据库版本迁移入口

src/modules/books/
  book.types.ts             账本类型
  book.repository.ts        账本数据访问
  book.store.ts             账本状态

src/modules/accounts/
  account.types.ts          账户类型
  account.repository.ts     账户数据访问
  account.store.ts          账户状态

src/modules/tags/
  tag.types.ts              Tag 类型
  tag.repository.ts         Tag 数据访问
  tag.store.ts              Tag 状态

src/modules/transactions/
  transaction.types.ts      流水类型
  transaction.repository.ts 流水和流水 Tag 数据访问
  transaction.service.ts    收入、支出、转账业务规则
  transaction.store.ts      流水状态

src/modules/recurring/
  recurring.types.ts        周期事件类型
  recurring.repository.ts   周期事件和周期事件 Tag 数据访问
  recurring.service.ts      到期检测、批准、跳过、下次日期计算
  recurring.store.ts        周期事件状态

src/pages/
  BooksPage.vue             账本管理页
  AccountsPage.vue          账户管理页
  TagsPage.vue              Tag 管理页
  TransactionsPage.vue      流水列表页
  TransactionEditorPage.vue 流水编辑页
  RecurringEventsPage.vue   周期事件管理页

docs/
  basic-data-design.md      基础数据设计方案
  basic-implementation-plan.md 基础功能实施计划
```

## 任务 1：初始化 SQLite 数据库

**Files:**

- Create: `src/modules/database/schema.ts`
- Create: `src/modules/database/connection.ts`
- Create: `src/modules/database/migrations.ts`

- [ ] 创建 SQLite 建表 SQL，包含 `books`、`accounts`、`tags`、`transactions`、`transaction_tags`、`recurring_events`、`recurring_event_tags`。
- [ ] 创建推荐索引，至少包含流水账本时间索引、流水账户索引、Tag 关联索引、周期事件触发索引。
- [ ] 实现数据库初始化入口，App 启动时执行建表和迁移。
- [ ] 本地运行类型检查。

Verification:

```bash
npm run typecheck
```

Expected: TypeScript 类型检查通过。

## 任务 2：实现账本管理

**Files:**

- Create: `src/modules/books/book.types.ts`
- Create: `src/modules/books/book.repository.ts`
- Create: `src/modules/books/book.store.ts`
- Create: `src/pages/BooksPage.vue`

- [ ] 实现账本创建、编辑、归档、列表读取。
- [ ] 创建默认账本逻辑；首次启动如果没有账本，创建一个默认账本。
- [ ] 页面展示账本列表，支持新增、重命名、归档。
- [ ] 归档账本不从数据库删除，历史流水继续保留。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 可以在页面创建账本，并在刷新后保留。

## 任务 3：实现账户管理

**Files:**

- Create: `src/modules/accounts/account.types.ts`
- Create: `src/modules/accounts/account.repository.ts`
- Create: `src/modules/accounts/account.store.ts`
- Create: `src/pages/AccountsPage.vue`

- [ ] 实现账户创建、编辑、归档、列表读取。
- [ ] 支持账户类型：现金、银行卡、信用卡、支付宝、微信、其他。
- [ ] 支持账户币种：`CNY`、`USD`、`AED`。
- [ ] 金额使用最小货币单位保存，界面负责格式化展示。
- [ ] 账户归档后不参与默认选择，但历史流水继续保留。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 可以创建不同币种账户，并在刷新后保留。

## 任务 4：实现 Tag 管理

**Files:**

- Create: `src/modules/tags/tag.types.ts`
- Create: `src/modules/tags/tag.repository.ts`
- Create: `src/modules/tags/tag.store.ts`
- Create: `src/pages/TagsPage.vue`

- [ ] 实现 Tag 创建、编辑、删除、排序字段维护。
- [ ] Tag 名称保持唯一。
- [ ] 删除 Tag 前检查是否有关联流水或周期事件；有关联时提示用户先解除关联。
- [ ] 页面展示 Tag 名称和颜色。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 可以维护 Tag，并阻止删除已被使用的 Tag。

## 任务 5：实现流水创建和账户余额变更

**Files:**

- Create: `src/modules/transactions/transaction.types.ts`
- Create: `src/modules/transactions/transaction.repository.ts`
- Create: `src/modules/transactions/transaction.service.ts`
- Create: `src/modules/transactions/transaction.store.ts`
- Create: `src/pages/TransactionEditorPage.vue`

- [ ] 实现收入创建：向 `transactions` 写入 `income`，增加账户余额。
- [ ] 实现支出创建：向 `transactions` 写入 `expense`，减少账户余额。
- [ ] 实现转账创建：向 `transactions` 写入 `transfer`，减少转出账户余额，增加转入账户余额。
- [ ] 转账只允许同币种账户；不同币种账户在界面上不可作为同一笔转账的组合。
- [ ] 写入流水和更新账户余额必须在同一个 SQLite 事务内完成。
- [ ] 创建流水时写入 `transaction_tags`。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 创建收入、支出、转账后，账户余额与流水一致。

## 任务 6：实现流水列表和基础筛选

**Files:**

- Modify: `src/modules/transactions/transaction.repository.ts`
- Modify: `src/modules/transactions/transaction.store.ts`
- Create: `src/pages/TransactionsPage.vue`

- [ ] 按 `occurred_at` 倒序展示流水。
- [ ] 支持按账本筛选。
- [ ] 支持按账户筛选。
- [ ] 支持按流水类型筛选。
- [ ] 支持按 Tag 筛选。
- [ ] 支持按日期范围筛选。
- [ ] 软删除流水时写入 `deleted_at`，列表默认不显示已删除记录。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 筛选结果与数据库数据一致，已软删除流水不出现在默认列表。

## 任务 7：实现周期事件配置

**Files:**

- Create: `src/modules/recurring/recurring.types.ts`
- Create: `src/modules/recurring/recurring.repository.ts`
- Create: `src/modules/recurring/recurring.service.ts`
- Create: `src/modules/recurring/recurring.store.ts`
- Create: `src/pages/RecurringEventsPage.vue`

- [ ] 实现周期事件创建、编辑、停用、列表读取。
- [ ] 支持 `daily`、`weekly`、`monthly`、`yearly`。
- [ ] 支持 `repeat_interval`。
- [ ] 支持 `start_date`、`end_date`、`next_trigger_date`。
- [ ] 周期事件可关联多个 Tag，并写入 `recurring_event_tags`。
- [ ] 转账周期事件只允许同币种账户。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 可以创建周期收入、周期支出、周期转账规则，并在刷新后保留。

## 任务 8：实现周期事件到期提示和手动批准

**Files:**

- Modify: `src/modules/recurring/recurring.repository.ts`
- Modify: `src/modules/recurring/recurring.service.ts`
- Modify: `src/modules/transactions/transaction.service.ts`
- Modify: `src/App.vue`

- [ ] App 启动时查询 `is_active = 1` 且 `next_trigger_date <= 今天` 的周期事件。
- [ ] 显示待处理周期事件列表。
- [ ] 用户选择批准时，生成对应流水，复制周期事件 Tag 到流水 Tag。
- [ ] 用户选择跳过时，不生成流水，只推进 `next_trigger_date`。
- [ ] 用户选择稍后处理时，不修改数据。
- [ ] 用户选择停用时，将周期事件 `is_active` 更新为 `0`。
- [ ] 批准和跳过都必须正确计算下一次触发日期；如果超过 `end_date`，将事件停用。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 到期周期事件只提示，不自动生成流水；批准后才写入流水。

## 任务 9：实现基础数据导出和恢复

**Files:**

- Create: `src/modules/database/backup.ts`
- Create: `src/pages/DataSettingsPage.vue`

- [ ] 实现 SQLite 数据库文件导出。
- [ ] 实现从 SQLite 数据库文件恢复。
- [ ] 恢复前提示用户当前数据会被替换。
- [ ] 恢复后重新初始化数据库连接并刷新当前页面数据。

Verification:

```bash
npm run typecheck
npm run dev
```

Expected: 导出后可恢复同一份账本、账户、Tag、流水和周期事件数据。

## 任务 10：Android 打包验证

**Files:**

- Modify: `capacitor.config.ts`
- Modify: `package.json`

- [ ] 添加 Capacitor Android 平台。
- [ ] 配置应用名称和包名。
- [ ] 确认 SQLite 插件在 Android 端可用。
- [ ] 使用 Android Studio 打开生成的 Android 工程。
- [ ] 构建 Debug APK。

Verification:

```bash
npm run build
npx cap sync android
```

Expected: Web 构建成功，Android 项目同步成功，并可在 Android Studio 构建 Debug APK。

## 数据一致性规则

- 创建、编辑、删除流水时，账户余额必须和流水变更在同一事务中完成。
- 删除流水使用软删除，不直接删除历史数据。
- 删除 Tag 前必须检查 `transaction_tags` 和 `recurring_event_tags`。
- 周期事件批准生成流水时，必须复制周期事件的 Tag。
- 周期事件不能自动生成流水，必须由用户手动批准。
- 不允许跨币种转账。

## 最小验收标准

- 用户可以创建账本、账户和 Tag。
- 用户可以创建收入、支出和同币种转账。
- 用户可以查看按时间倒序排列的流水列表。
- 用户可以按账本、账户、类型、Tag、日期筛选流水。
- 用户可以创建周期事件。
- App 打开时会提示到期周期事件。
- 周期事件只有在用户批准后才生成流水。
- 数据保存在 SQLite 中，刷新或重启后仍然存在。
- 项目可以完成 Web 构建，并能同步到 Android 工程。
