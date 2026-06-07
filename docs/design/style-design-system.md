# Vuetify 字体与颜色设计规范

本文档按 Vuetify 4.1 和当前移动端设计稿定义全局 theme token、defaults 与 typography 使用规则。页面和组件应优先使用 Vuetify theme token、Vuetify props、Vuetify typography class 和已有全局样式，不应在局部硬编码颜色。

## 字体规范

### 推荐 font-family

```ts
export const appFontFamily = [
  system-ui,
  'MiSans',
  'HarmonyOS Sans SC',
  'OPPOSans',
  'Noto Sans SC',
  'PingFang SC',
  'Microsoft YaHei',
  sans-serif;
].join(', ')
```

中文 Android / Windows 浏览器兼容优先：
`Roboto + Noto Sans SC + Microsoft YaHei`。

---

## Vuetify 全局配置 Token

### Theme 名称

项目使用 4 套 Vuetify theme：

- `greenLight`
- `greenDark`
- `orangeLight`
- `orangeDark`

默认主题为 `greenLight`。

### 项目需要定义的 Token

以下 token 必须在 4 套主题中全部定义。

| Token           | greenLight | greenDark | orangeLight | orangeDark | 用途                                         |
| --------------- | ---------- | --------- | ----------- | ---------- | -------------------------------------------- |
| background      | `#F4F8F6`  | `#071412` | `#F8F5EF`   | `#17120D`  | 页面背景                                     |
| surface         | `#FFFFFF`  | `#10201D` | `#FFFFFF`   | `#241A12`  | 卡片、弹层、列表容器背景                     |
| surface-variant | `#F0F6F3`  | `#172A26` | `#FFF7ED`   | `#2B2118`  | 浅底区域、输入/筛选背景                      |
| primary         | `#0F766E`  | `#2DD4BF` | `#F97316`   | `#FB923C`  | 主按钮、主图标、导航选中文字/图标            |
| secondary       | `#14B8A6`  | `#5EEAD4` | `#FDBA74`   | `#FDBA74`  | 辅助强调、渐变辅助色                         |
| accent          | `#DFF5EF`  | `#134E4A` | `#FFEDD5`   | `#431407`  | 选中态背景、底部导航选中背景、选中 chip 背景 |
| outline         | `#DDEBE6`  | `#21413B` | `#F1E7D8`   | `#3A2A1E`  | 低对比边框、分割线                           |
| on-background   | `#111827`  | `#F9FAFB` | `#111827`   | `#F9FAFB`  | 页面背景上的文字基色                         |
| on-surface      | `#111827`  | `#F9FAFB` | `#111827`   | `#F9FAFB`  | 卡片和弹层上的文字基色                       |
| on-primary      | `#FFFFFF`  | `#042F2E` | `#FFFFFF`   | `#431407`  | primary 背景上的文字/图标                    |
| on-secondary    | `#062F2B`  | `#042F2E` | `#431407`   | `#431407`  | secondary 背景上的文字/图标                  |
| summary         | `#10B981`  | `#0F766E` | `#FDBA74`   | `#EA580C`  | 顶部收支概览卡背景                           |
| income          | `#059669`  | `#34D399` | `#059669`   | `#34D399`  | 收入金额、收入趋势                           |
| expense         | `#DC2626`  | `#F87171` | `#DC2626`   | `#F87171`  | 支出金额、支出趋势                           |
| error           | `#DC2626`  | `#F87171` | `#DC2626`   | `#F87171`  | 校验错误、失败状态、危险操作                 |
| warning         | `#D97706`  | `#FBBF24` | `#D97706`   | `#FBBF24`  | 警告、储蓄率等非错误提醒                     |

### Theme 配置目标

Vuetify theme 应配置为以下结构。实际实现可以保持模块内现有导入和 icon 配置，但 theme token 应按本节定义。

```ts
theme: {
  defaultTheme: config.vuetify?.default_theme ?? 'greenLight',
  themes: {
    greenLight: {
      dark: false,
      colors: {
        background: '#F4F8F6',
        surface: '#FFFFFF',
        'surface-variant': '#F0F6F3',
        primary: '#0F766E',
        secondary: '#14B8A6',
        accent: '#DFF5EF',
        outline: '#DDEBE6',
        'on-background': '#111827',
        'on-surface': '#111827',
        'on-primary': '#FFFFFF',
        'on-secondary': '#062F2B',
        summary: '#10B981',
        income: '#059669',
        expense: '#DC2626',
        error: '#DC2626',
        warning: '#D97706',
      },
    },
    greenDark: {
      dark: true,
      colors: {
        background: '#071412',
        surface: '#10201D',
        'surface-variant': '#172A26',
        primary: '#2DD4BF',
        secondary: '#5EEAD4',
        accent: '#134E4A',
        outline: '#21413B',
        'on-background': '#F9FAFB',
        'on-surface': '#F9FAFB',
        'on-primary': '#042F2E',
        'on-secondary': '#042F2E',
        summary: '#0F766E',
        income: '#34D399',
        expense: '#F87171',
        error: '#F87171',
        warning: '#FBBF24',
      },
    },
    orangeLight: {
      dark: false,
      colors: {
        background: '#F8F5EF',
        surface: '#FFFFFF',
        'surface-variant': '#FFF7ED',
        primary: '#F97316',
        secondary: '#FDBA74',
        accent: '#FFEDD5',
        outline: '#F1E7D8',
        'on-background': '#111827',
        'on-surface': '#111827',
        'on-primary': '#FFFFFF',
        'on-secondary': '#431407',
        summary: '#FDBA74',
        income: '#059669',
        expense: '#DC2626',
        error: '#DC2626',
        warning: '#D97706',
      },
    },
    orangeDark: {
      dark: true,
      colors: {
        background: '#17120D',
        surface: '#241A12',
        'surface-variant': '#2B2118',
        primary: '#FB923C',
        secondary: '#FDBA74',
        accent: '#431407',
        outline: '#3A2A1E',
        'on-background': '#F9FAFB',
        'on-surface': '#F9FAFB',
        'on-primary': '#431407',
        'on-secondary': '#431407',
        summary: '#EA580C',
        income: '#34D399',
        expense: '#F87171',
        error: '#F87171',
        warning: '#FBBF24',
      },
    },
  },
}
```

---

## Defaults 配置

Vuetify defaults 应使用组件级配置。不要把 `class` 或 `style` 写入 `defaults.global`，因为 Vuetify 不会在 global defaults 中应用这些字段。

```ts
defaults: {
  VAppBar: {
    color: 'background',
    flat: true,
  },

  VAppBarTitle: {
    style: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
  },

  VBtn: {
    elevation: 0,
    height: 48,
    rounded: 'xl',
    class: 'text-none',
    style: {
      letterSpacing: 0,
    },
  },

  VCard: {
    rounded: 'xl',
    elevation: 0,
  },

  VChip: {
    rounded: 'xl',
    style: {
      fontSize: '0.75rem',
    },
  },

  VTextField: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    rounded: 'lg',
    style: {
      fontSize: '0.875rem',
    },
  },

  VTextarea: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    rounded: 'lg',
    style: {
      fontSize: '0.875rem',
    },
  },

  VSelect: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    rounded: 'lg',
    style: {
      fontSize: '0.875rem',
    },
  },

  VFileInput: {
    variant: 'outlined',
    density: 'comfortable',
    color: 'primary',
    rounded: 'lg',
    style: {
      fontSize: '0.875rem',
    },
  },

  VList: {
    bgColor: 'transparent',
  },

  VListItem: {
    rounded: 'lg',
  },

  VBottomNavigation: {
    style: {
      fontSize: '0.75rem',
    },
  },

  VBottomSheet: {
    contentClass: 'rounded-t-xl overflow-hidden',
  },
}
```

---

## 全局样式变量

```scss
:root {
  --app-page-padding: 1rem;
  --app-section-gap: 1rem;
  --app-card-shadow: 0 0.75rem 1.875rem rgba(15, 23, 42, 0.06);
}
```

卡片列表、页面区块和表单分组使用 `--app-section-gap` 作为默认间距。

## Layout 尺寸单位

- 用于布局尺寸的 `width` / `height` / `min-width` / `min-height` / `max-width` / `max-height` 应使用百分比或 `px`。
- 优先使用百分比表达随容器变化的尺寸；只有固定格式控件、图表画布、图标、触控目标或稳定高度要求明确时才使用 `px`。
- 不使用 `rem`、`em`、`vw`、`vh` 作为布局宽高单位；这些单位可以继续用于字体、间距、圆角或阴影等非宽高属性。

---

## Typography 使用规范

Vuetify 4 使用 MD3 typography 命名。页面和组件应优先使用以下 class；如果设计稿需要更精确的金额字号，可以使用局部 scoped style，但颜色仍必须来自 theme token。

| 用途                 | Vuetify Class                            |
| -------------------- | ---------------------------------------- |
| 页面标题             | `text-headline-large font-weight-bold`   |
| 卡片标题             | `text-headline-small font-weight-bold`   |
| 区块标题             | `text-title-large font-weight-bold`      |
| 金额/货币代码        | `text-headline-small font-weight-bold`   |
| 正文                 | `text-body-large text-high-emphasis`     |
| 辅助说明             | `text-body-medium text-medium-emphasis`  |
| 时间                 | `text-label-medium text-medium-emphasis` |
| placeholder / 弱提示 | `text-body-medium text-disabled`         |
| 按钮文字             | `text-label-large font-weight-bold`      |

---

## Color Token 使用规范

| 用途           | Token / Class                            |
| -------------- | ---------------------------------------- |
| 页面背景       | `background`                             |
| 卡片背景       | `surface`                                |
| 输入框背景     | `surface-variant`                        |
| 主按钮         | `primary`                                |
| 次强调         | `secondary`                              |
| 选中态背景     | `accent`                                 |
| 边框           | `outline`                                |
| 主文字         | 默认文字色或 `text-high-emphasis`        |
| 次文字         | `text-medium-emphasis`                   |
| 弱提示         | `text-disabled`                          |
| 顶部概览卡背景 | `summary`                                |
| 顶部概览卡文字 | `on-primary`                             |
| 收入           | `income`                                 |
| 支出           | `expense`                                |
| 错误           | `error`                                  |
| 警告/提醒      | `warning`                                |
| Chip 背景      | `surface` / `surface-variant` / `accent` |
| Chip 文字      | 默认文字色 / `primary`                   |
| 导航选中背景   | `accent`                                 |
| 导航选中文字   | `primary`                                |
