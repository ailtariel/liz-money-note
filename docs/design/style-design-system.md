# Vuetify 字体与颜色设计规范

## 字体规范

### 推荐 font-family

```ts
export const appFontFamily = [
  'Roboto',
  'Noto Sans SC',
  'Noto Sans',
  'Microsoft YaHei',
  'PingFang SC',
  'HarmonyOS Sans SC',
  'Arial',
  'sans-serif',
].join(', ')
```

中文 Android / Windows 浏览器兼容优先：
`Roboto + Noto Sans SC + Microsoft YaHei`。

---

## Vuetify 全局配置 Token

### 新增颜色 Token

- on-background
- on-surface
- on-primary
- on-secondary
- surface-variant
- outline
- muted
- subtle

### Theme 示例

使用之前定义的 greenLight / greenDark / orangeLight / orangeDark，推荐统一采用：

```ts
'on-background'
'on-surface'
'on-primary'
'on-secondary'
'surface-variant'
'outline'
'muted'
'subtle'
```

替代：

```ts
'text-primary'
'text-secondary'
'card-border'
```

---

## Defaults 配置

```ts
defaults: {
  VCard: {
    rounded: 'xl',
    elevation: 0,
  },

  VBtn: {
    rounded: 'xl',
    elevation: 0,
  },

  VTextField: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    rounded: 'lg',
  },

  VSelect: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    rounded: 'lg',
  },
}
```

---

# Typography 使用规范

| 用途 | Vuetify Class |
|--------|--------|
| 页面标题 | text-h5 font-weight-bold |
| 卡片标题 | text-h6 font-weight-bold |
| 金额/货币代码 | text-h6 font-weight-bold |
| 正文 | text-body-1 |
| 辅助说明 | text-body-2 text-muted |
| 时间 | text-caption text-muted |
| 按钮文字 | text-button font-weight-bold |

---

# Color Token 使用规范

| 用途 | Token |
|--------|--------|
| 页面背景 | background |
| 卡片背景 | surface |
| 输入框背景 | surface-variant |
| 主按钮 | primary |
| 次强调 | secondary |
| 选中态背景 | accent |
| 边框 | outline |
| 主文字 | on-surface |
| 次文字 | muted |
| 弱提示 | subtle |
| 收入 | income |
| 支出 | expense |
| 成功 | success |
| 错误 | error |
| 导航选中背景 | nav-active-bg |
| 导航选中文字 | nav-active-text |

---

# 组件设计规则

- 所有 Card 使用 rounded-xl
- 卡片之间保持 16~24px 间距
- 主按钮高度 44~48px
- 输入框使用 outlined
- 列表选中项使用 accent 背景
- 选中图标使用 primary
- 避免高对比边框
- 避免使用硬编码颜色
- 所有颜色引用 Vuetify Theme Token

---

# AI 页面设计 Prompt

请按 Vuetify 3 设计规范生成移动端页面。

尺寸：430 × 932。

整体风格：
简洁、圆角卡片、轻柔背景、低对比阴影、现代记账/财务工具风格。

字体：
使用 Roboto / Noto Sans SC / Microsoft YaHei / PingFang SC / sans-serif。

页面标题使用 text-h5 font-weight-bold。

卡片标题使用 text-h6 font-weight-bold。

正文使用 text-body-1。

辅助说明、时间、描述使用 text-body-2 或 text-caption，并使用 muted/subtle 颜色。

按钮文字使用 text-button font-weight-bold。

颜色 Token：

- background
- surface
- primary
- secondary
- accent
- outline
- on-surface
- muted
- subtle
- income
- expense
- success
- error
- nav-active-bg
- nav-active-text

组件规则：

- Card 使用 rounded-xl
- Button 使用 rounded-xl
- 主按钮高度 44~48px
- 输入框使用 outlined + rounded-lg
- 列表选中项使用 accent 背景
- 图标使用 primary
- 不允许硬编码颜色
- 尽量复用 Vuetify Typography 与 Theme Token
