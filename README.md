<p align="center">
  <img src="https://img.shields.io/npm/v/dom-inspector?color=42b883" alt="npm version" />
  <img src="https://img.shields.io/npm/types/dom-inspector?color=3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/bundlephub/minzip/dom-inspector?color=ff6600" alt="min+gzip size" />
  <img src="https://img.shields.io/npm/lm/dom-inspector?color=green" alt="license" />
</p>

<h1 align="center">dom-inspector</h1>

<p align="center">
  零依赖、零配置的通用 DOM 元素检查器 — hover 高亮，点击选中，获取完整 DOM 信息
</p>

<p align="center">
  <b>支持 Vue / React 组件识别 · CSS 路径生成 · 纯 TypeScript 编写</b>
</p>

---

## 它是什么？

`dom-inspector` 是一个可以在**任意网页**中使用的交互式 DOM 元素选取工具。

用户点击「启动」后：
1. **鼠标悬停** → 页面元素被绿色高亮框覆盖 + 显示标签名和尺寸
2. **鼠标点击** → 选中该元素，返回完整的 DOM 信息（位置、CSS 路径、框架组件等）
3. **按 Escape** → 退出 inspect 模式

灵感来自 [Vue DevTools](https://github.com/vuejs/devtools) 的 inspect 功能，但**不依赖任何浏览器扩展或构建工具**，纯 JavaScript 实现，可在任何网页环境中运行。

## 特性一览

| 功能 | 说明 |
|------|------|
| Hover 高亮 | 实时追踪鼠标位置，绘制半透明高亮框 |
| 信息卡片 | 悬停时显示元素标签名和像素尺寸 |
| 点击选中 | capture 阶段拦截 click，返回完整 InspectResult |
| CSS 路径生成 | 自动生成 `cssPath`（完整路径）和 `uniqueSelector`（最短唯一选择器） |
| Vue 组件识别 | 通过 `__vueParentComponent` 检测 Vue 3 / Vue 2 组件实例 |
| React 组件识别 | 通过 `__reactFiber$*` 检测 React Fiber 节点 |
| 计算样式 | 提取 display/position/color/fontSize/margin/padding 等关键样式 |
| 双 API 模式 | 回调模式（长期使用）+ Promise 模式（一次性） |
| 零依赖运行时 | 打包后仅 ~8KB (gzip: **2.77KB**)，无任何 npm 依赖 |
| 完整 TypeScript | 内置 .d.ts 类型声明，所有 API 均有 JSDoc 注释 |

## 安装

```bash
# npm
npm install dom-inspector

# pnpm
pnpm add dom-inspector

# yarn
yarn add dom-inspector
```

> 无需安装 peer dependencies。本包零运行时依赖。

## 快速开始

### 方式一：回调模式（推荐用于长期交互）

```typescript
import { createInspector } from 'dom-inspector'

const inspector = createInspector({
  // 自定义高亮颜色
  color: '#ff6600',

  // 是否显示信息卡片
  showInfoCard: true,

  // 选中元素后的回调
  onSelect: (result) => {
    console.log('tagName:', result.tagName)        // "div"
    console.log('id:', result.id)                  // "app"
    console.log('classNames:', result.classNames)   // ["container", "main"]
    console.log('rect:', result.rect)              // { top:0, left:0, width:800, height:600 }
    console.log('cssPath:', result.cssPath)         // "div#app > div.container"
    console.log('uniqueSelector:', result.uniqueSelector) // "#app"
    console.log('framework:', result.framework)
    // { type: "vue", name: "App", props: { title: "Hello" } }
    console.log('computedStyle:', result.computedStyle)

    // 返回 false 可阻止自动退出（继续选择下一个元素）
    return true
  },

  // 用户按 Escape 取消时的回调
  onCancel: () => {
    console.log('用户取消了')
  },
})

// 启动 inspect 模式
inspector.start()

// 手动停止（可重新 start）
inspector.stop()

// 彻底销毁（不可恢复，需重新 createInspector）
inspector.destroy()
```

### 方式二：Promise 模式（适合一次性选取）

```typescript
import { inspectOnce } from 'dom-inspector'

try {
  const result = await inspectOnce({ color: '#42b883' })
  console.log('选中的元素:', result.uniqueSelector)
  if (result.framework) {
    console.log(`这是 ${result.framework.type} 组件: ${result.framework.name}`)
  }
} catch {
  console.log('用户按 Escape 取消了')
}
```

### 在 HTML 中直接使用（CDN / ES Module）

```html
<script type="module">
  import { createInspector } from './node_modules/dom-inspector/dist/index.js'

  document.querySelector('#pick-btn').addEventListener('click', () => {
    createInspector({
      onSelect(result) {
        alert(`选中了: ${result.uniqueSelector}`)
      },
    }).start()
  })
</script>
```

## API 参考

### `createInspector(options?)`

创建并返回一个 Inspector 实例。

#### 参数：`InspectorOptions`

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | `string` | `'#42b883'` | 高亮框颜色（十六进制） |
| `backgroundOpacity` | `number` | `0.15` | 高亮框背景透明度 (0~1) |
| `showInfoCard` | `boolean` | `true` | 是否显示悬浮信息卡片 |
| `ignoreSelector` | `string` | inspector 自身 + body/html | 忽略的 CSS 选择器 |
| `destroyOnEscape` | `boolean` | `true` | Escape 时 destroy(true) 还是 stop(false) |
| `onSelect` | `(result) => void \| boolean` | - | 选中回调，返回 `false` 不自动退出 |
| `onCancel` | `() => void` | - | 用户取消（Escape）时的回调 |

#### 返回值：`DomInspectorInstance`

| 方法 | 说明 |
|------|------|
| `start()` | 进入 inspect 模式 |
| `stop()` | 退出但保留实例（可重新 start） |
| `destroy()` | 彻底销毁实例和 DOM |
| `isInspecting()`: `boolean` | 当前是否在 inspect 中 |

### `inspectOnce(options?)`

一次性 inspect，返回 `Promise<InspectResult>`。

- 用户点击 → Promise resolve
- 用户按 Escape → Promise reject

### `InspectResult` 类型

选中元素的完整信息：

```typescript
interface InspectResult {
  element: HTMLElement          // 原始 DOM 元素引用
  tagName: string              // 标签名（小写）
  id: string                   // 元素 ID
  classNames: string[]         // 类名列表
  rect: DomRect                // 视口边界矩形
  cssPath: string              // 完整 CSS 选择器路径
  uniqueSelector: string       // 最短唯一 CSS 选择器
  framework?: FrameworkInfo     // Vue/React 组件信息（如有）
  computedStyle: Record<string, string>  // 计算样式子集
}
```

### 子模块导出（高级用法）

```typescript
import {
  getCssPath,
  getUniqueSelector,
  getComputedStyles,
  detectFramework,
} from 'dom-inspector'

// 单独获取某个元素的 CSS 路径
const path = getCssPath(document.querySelector('#app')!)
// → "div#app > div.container > main"

// 单独检测框架组件
const info = detectFramework(someElement)
// → { type: "vue", name: "UserCard", props: { name: "...", age: 25 } }
```

## 使用场景

### 场景一：可视化页面编辑器

```typescript
// 用户点击「选取元素」按钮后进入 inspect 模式
// 选中后把元素信息传给编辑器面板
document.getElementById('pick-element')!.onclick = () => {
  createInspector({
    onSelect(result) {
      editorPanel.loadElement(result.uniqueSelector, result.computedStyle)
      return true
    },
  }).start()
}
```

### 场景二：低代码平台组件拾取

```typescript
// 在低代码画布中让用户点选页面上的组件
async function pickComponentFromPage() {
  const result = await inspectOnce()
  if (result.framework?.type === 'vue') {
    return {
      componentName: result.framework.name,
      props: result.framework.props,
      domPath: result.cssPath,
    }
  }
  throw new Error('请选择一个 Vue/React 组件')
}
```

### 场景三：辅助测试工具

```typescript
// 测试脚本中快速获取元素的选择器
import { getUniqueSelector } from 'dom-inspector'
const selector = getUniqueSelector(document.querySelector('.submit-btn')!)
console.log(`测试用选择器: ${selector}`)
```

### 场景四：浏览器控制台调试

```javascript
// 直接在 Console 中使用（如果已通过 script 标签引入）
const ins = domInspector.createInspector({ color: '#e74c3c' })
ins.start()
// 点完之后看 Console 输出
```

## 与同类方案对比

| 包名 | 月下载量 | 定位 | 需要 Vite/Webpack? | 支持 Vue? | 支持 React? | 有高亮交互? | 输出内容 |
|------|---------|------|-------------------|----------|-------------|------------|---------|
| **dom-inspector** (本包) | 新发布 | **通用 DOM 选取器** | ❌ 否 | ✅ 是 | ✅ 是 | ✅ hover+click | 完整 DOM 信息 + 框架组件 |
| [@medv/finder](https://www.npmjs.com/package/@medv/finder) | 365 万 | CSS 选择器生成器 | ❌ 否 | ❌ | ❌ | ❌ | 仅 CSS 选择器字符串 |
| [css-selector-generator](https://www.npmjs.com/package/css-selector-generator) | 12.7 万 | CSS 选择器生成器 | ❌ 否 | ❌ | ❌ | ❌ | 仅 CSS 选择器字符串 |
| [vite-plugin-vue-inspector](https://www.npmjs.com/package/vite-plugin-vue-inspector) | 523 万 | Vue IDE 跳转 | ✅ 必须 | ✅ 仅 Vue | ❌ | ✅ | IDE 文件路径 |
| [react-inspector](https://www.npmjs.com/package/react-inspector) | 981 万 | React 数据查看面板 | ❌ 否 | ❌ | ✅ 仅 React | ❌ | 嵌入式面板 UI |
| [code-inspector-plugin](https://www.npmjs.com/package/code-inspector-plugin) | 97 万 | IDE 跳转（多框架） | ✅ 必须 | ✅ | ✅ | ✅ | IDE 文件路径 |

### 核心差异总结

```
                    功能丰富度 ↑
                       │
   react-inspector ────┼──── ● 最丰富（但仅 React，嵌入式面板）
                       │
   dom-inspector ──────┼──── ★ 我们的位置
                       │        通用 + 交互 + 框架识别 + 零配置
   code-inspector ────┼
                       │
   vite-plugin-xxx ────┼
                       │
   @medv/finder ──────┴──── ● 最精准（但纯工具函数，无交互）

    ════════════════════╧═════════════════════════
         纯工具函数          可视化交互
```

**一句话**: npm 上有做选择器生成的，有做框架 Inspector 的，有做 IDE 跳转的。但没有一个同时做到 **hover 高亮 + click 选中 + 框架识别 + 零依赖 + 任意网页可用** 的通用 DOM Inspect 工具。

## 技术原理

### 高亮机制

通过动态创建一个 `position: fixed; z-index: 2147483647; pointer-events: none` 的 `<div>` 覆盖层，在 `mouseover` 事件中实时更新其位置和尺寸来模拟高亮效果。不修改目标页面的任何 DOM 结构。

### DOM → 组件映射

利用前端框架编译时注入到每个 DOM 元素上的内部属性：

| 框架 | 属性名 | 提取的信息 |
|------|--------|-----------|
| Vue 3 | `element.__vueParentComponent` | 组件名 (`type.name`)、Props |
| Vue 2 | `element.__vue__` | 组件名 (`$options.name`)、Props |
| React | `element.__reactFiber$*` | 组件名 (`type.displayName`)、Props |

### CSS 选择器生成策略

1. **ID 优先** — 如果元素有唯一 ID，直接返回 `#id`
2. **类名组合** — 从少到多尝试类名子集，找到能唯一定位的最短组合
3. **完整路径回退** — 向上遍历父节点，拼接 `tag.class:nth-of-type(n)` 路径

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 监听模式构建
npm run dev

# 本地测试
python -m http-server . -p 8080
# 然后打开 http://localhost:8080/test.html
```

## 浏览器兼容性

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| ✅ 90+ | ✅ 90+ | ✅ 14.1+ | ✅ 90+ |

需要支持 `CSS.escape()` 和 ES2020+ 语法。

## License

[MIT](./LICENSE)

---

<p align="center">
  Made with inspiration from <a href="https://github.com/vuejs/devtools">Vue DevTools</a>
</p>
