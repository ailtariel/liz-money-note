- 新增流水时，默认使用：
  当前账本 + 最后一条流水的账户 > 上次账本 + 最后一条流水的账户 > 上次账本 + 上次账户

- 解决jeep-sqlite crypto externalized 和 ECharts chunk size 警告
- 增加货币自动换算提示文本
- 统计页选择账户时，货币自动根据选择的账户货币切换
- 模仿echart，tag预设多个颜色，初始化和新增tag（包括导入）时自动在里面循环获取预选值

- 允许自定义新增流水成功音效
- 合并账本
- 从复制文本中创建流水

- 加about页
- 账本和账户“归档”没有意义，改成删除；界面要美化
- 性能优化：
  - 流水页
    - 添加item-height + shallowRef + 替换数组引用 + 稳定 key
    - 复杂查找预先建map
    - 检查并优化每个item都会重复进行的操作
    - 加loading
    - 注意减少无谓引用
- 新增流水按钮移到下方正中，顺手
- 账本
  - 新增设置默认账本功能
  - 打开流水页默认打开默认账本而不是全部账本

# done

- 设置>数据 中，4项合并为2项
- 统计页
- 全局snack queue模块
- [Vuetify UPGRADE] 'theme.global.name.value = greenLight' is deprecated, use 'theme.change('greenLight')' instead.
- 数据导入BUG
- github CI/CD
- 自动更新功能
- 全局确认对话框组件
- 删除缓存时不要删除数据库；加确认提示
