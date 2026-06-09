# 前端规则

本文档是仓库级前端规则，适用于页面、布局、组件、样式、状态和交互相关的代码修改。

通用 Vuetify 实施原则以当前可用的 Vuetify skill 为准；本文档只记录本仓库自己的前端架构边界和约束。

## App / Layout / Page 分层

推荐前端结构分为 app / layout / page：

```text
app
- layout 1
  - page 1.1
  - page 1.2
- layout 2
  - page 2.1
  - page 2.2
```

## App 层

`App.vue` 负责应用根边界和跨页面能力。

App 层可以负责：

- 应用级 provider。
- 全局模块挂载。
- 顶层 overlay。
- 全局初始化。
- 主题、语言、定时任务等跨页面能力。
- 全局消息、全局弹窗、全局 bottom sheet、snackbar 等跨页面交互。

App 层不负责：

- 具体页面内容。
- 页面内表单。
- 页面筛选。
- 页面列表。
- 页面级弹窗。
- 页面业务交互。

## Layout 层

Layout 负责布局套系。一个 app 可以有多个 layout。

Layout 层可以负责：

- 稳定 shell 结构。
- 子路由渲染。
- 底部导航、drawer、footer 等跨页面 shell 组件。
- 共享布局边界。
- 与 route meta 相关的 shell 显示规则。

Layout 层不负责：

- 页面业务逻辑。
- 页面级状态。
- 页面级操作。
- 通过 route name 分支实现页面业务行为。

Layout 级导航、drawer、footer 等共享 shell 组件应抽成可复用组件，再由 layout 引入。

## Page 层

Page 负责具体功能内容和页面级交互。

Page 层负责：

- 页面内容。
- 页面级状态。
- 页面级操作。
- 页面内容容器。
- 页面 padding。
- 页面滚动区域。
- 页面局部布局结构。

Page 不应重复创建已经由 app 或 layout 负责的底部导航、drawer、footer 或全局滚动容器，除非该路由明确使用不同 layout。

避免创建只复刻 app 或 layout 职责的页面包装组件。

## Shared Component

当 UI 结构或交互模式被多个页面复用时，应抽为 shared component。

Shared component 应：

- 通过 props、slots 和 events 暴露变化点。
- 避免在组件内部使用 route name 分支实现页面差异。
- 保持与业务领域弱绑定，除非它是明确的跨功能业务组件。

如果一个共享组件在不同页面需要不同按钮、操作区或局部内容，优先使用 slot 提供扩展点。

## Feature Component

Feature component 负责功能内的局部业务 UI。

Feature component 可以负责：

- 独立业务功能。
- 可复用业务模块。
- 局部交互。
- 只服务当前 feature 的 UI 组织。

Feature component 可以拥有 scoped style，但不应把业务特定样式上升为全局 token 或全局 class，除非它已经成为跨页面复用 pattern。

## Feature Module 边界

`src/modules/` 用于存放功能模块。

一个 module 是一个产品或业务功能，可以包含：

- 页面。
- route-level UI。
- domain types。
- stores。
- repositories。
- services。
- feature composables。
- 功能私有组件。

规则：

- 功能页面及其领域数据、store、repository、service、feature composable 和私有组件应放在 `src/modules/<feature>/` 下。
- `src/components/` 存放 UI 组件。
- `src/components/` 中的组件可以包含页面结构或小型局部交互逻辑，但不应拥有大量领域数据流、持久化、repository、service 或业务 workflow。
- `src/components/shared/` 只放被多个功能复用且不绑定单一业务领域的组件。
- `src/shared/lib/` 只放跨功能逻辑库，不放页面或 UI 组件。
- 只被单个 Vue 文件使用的类型可以留在该 Vue 文件内。
- 被多个文件共享的类型应移动到最近的 feature-level `*.types.ts` 或 UI-specific types 文件。

## 状态、数据同步和消息

- Vue 和 Pinia state 应被视为 UI 响应式来源。
- 组件不应为了让 Vue 更新而在 mutation 后手动重新加载数据。
- 会修改持久化数据的 store action，负责在需要时刷新或更新自身 state 及直接相关 store state。
- 组件级消息用于本地表单校验或页面内反馈。
- 系统级操作反馈、全局错误、确认流程、toast/snackbar 和跨页面交互提示应进入全局消息模块。
- Feature composable 可以在功能模块明确避免重复 store/computed/helper setup 时缓存单例，但这个模式必须显式且限制在 feature 范围内。

## 弹窗操作按钮

- 所有弹出窗口、确认框、底部弹窗表单中，如果同时出现确认类操作和取消类操作，按钮顺序必须为左侧确认、右侧取消。
- 确认类操作包括确定、保存、新增、删除、清理、重置、导入、保留、忽略、应用筛选等会应用结果的动作。
- 取消类操作包括取消、中止、关闭、不应用更改等放弃当前弹窗结果的动作。
- 只有选择列表、详情弹窗、键盘弹窗等没有显式取消按钮的弹窗，可以不额外添加取消按钮。

## 滚动边界

- Layout 定义固定区域。
- 页面内容区域定义剩余内容和页面滚动。
- 滚动边界必须明确。
- 避免多个层级同时承担主滚动。
- 不要通过全局 overflow hack 掩盖布局问题。
- 不要用滚动容器规避 app / layout / page 职责不清。

## 样式边界

- 全局样式负责统一基础风格。
- 页面和组件可以拥有局部 scoped style。
- 局部样式应只影响当前组件或页面。
- 不应复制已经由全局 theme、defaults、Sass variables 或共享组件管理的通用属性。
- 只有跨页面复用的视觉语义或组件约定，才应上升为全局 token、global defaults 或 shared component。

## 开发服务器

- 当前端验证需要运行应用时，AI agent 可以启动本地开发服务器。
- AI agent 启动的开发服务器必须在任务完成前停止。
- 最终回复前不得遗留后台开发服务器进程。
