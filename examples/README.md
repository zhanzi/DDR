# DDR 示例文件

本目录包含了DDR报表组件的各种使用示例，按功能和框架分类。

## 📁 目录结构

### 基础示例
- **basic/** - 基础HTML示例，展示DDR的基本功能
- **simple-test/** - 简单测试示例
- **header-fix-test/** - 表头固定测试示例
- **export-test/** - 导出功能测试示例

### 框架集成示例
- **vue/** - Vue 3 集成示例
  - `VueDDRExample.vue` - Vue 3 组件示例
  - `实际使用示例.vue` - 实际项目使用示例
- **vue2/** - Vue 2 集成示例
  - `Vue2使用示例.vue` - Vue 2 组件示例
  - `Vue2完整示例.html` - Vue 2 完整HTML示例
  - `Vue2适配器示例.js` - Vue 2 适配器使用示例
- **react/** - React 集成示例
  - `ReactDDRExample.tsx` - React 组件示例

### 功能特性示例
- **excel-test/** - Excel导出功能测试
  - `test-excel-export.html` - Excel导出测试页面
- **grouping-builtin/** - 内置分组功能示例
  - `index.html` - 分组功能演示
- **subtotal/** - 小计合计功能示例
  - `index.html` - 小计合计演示

## 🚀 快速开始

### 1. 基础示例
```bash
# 打开基础示例
open examples/basic/index.html
```

### 2. Vue 3 示例
```bash
# 查看Vue 3组件示例
open examples/vue/VueDDRExample.vue
```

### 3. React 示例
```bash
# 查看React组件示例
open examples/react/ReactDDRExample.tsx
```

### 4. 功能测试
```bash
# Excel导出测试
open examples/excel-test/test-excel-export.html

# 分组功能测试
open examples/grouping-builtin/index.html

# 小计合计测试
open examples/subtotal/index.html
```

## 📖 相关文档

更多详细的使用说明请参考 `docs/` 目录：
- `docs/Vue使用指南.md` - Vue集成详细指南
- `docs/Vue2直接使用browser版本指南.md` - Vue2集成指南
- `docs/PDF导出配置优先级说明.md` - PDF导出配置说明
- `docs/数据行合并功能配置指南.md` - 数据合并功能说明
- `docs/grouping-builtin-guide.md` - 内置分组功能指南
- `docs/subtotal-guide.md` - 小计合计功能指南

## 💡 提示

1. 所有示例都可以直接在浏览器中打开运行
2. Vue和React示例需要相应的开发环境
3. 示例中的数据都是模拟生成的，可以根据需要修改
4. 建议从基础示例开始，逐步了解各种功能
