/**
 * DOM Inspector 核心类型定义
 * @module dom-inspector/types
 */

/** 元素边界矩形（相对视口） */
export interface DomRect {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

/** 检测到的框架组件信息 */
export interface FrameworkInfo {
  /** 框架类型 */
  type: 'vue' | 'react' | 'unknown'
  /** 组件名称 */
  name?: string
  /** 组件 props（已过滤内部属性） */
  props?: Record<string, unknown>
}

/** Vue 框架检测信息（带类型扩展） */
export interface VueFrameworkInfo extends FrameworkInfo {
  type: 'vue'
}

/** React 框架检测信息（带类型扩展） */
export interface ReactFrameworkInfo extends FrameworkInfo {
  type: 'react'
}

/** Inspect 结果 — 用户选中元素时返回的完整信息 */
export interface InspectResult {
  /** 原始 DOM 元素引用 */
  element: HTMLElement
  /** 标签名（小写，如 "div"、"button"） */
  tagName: string
  /** 元素 ID */
  id: string
  /** 元素 class 列表 */
  classNames: string[]
  /** 相对视口的位置和尺寸 */
  rect: DomRect
  /** 完整 CSS 选择器路径（如 "div#app > div.container > span:nth-of-type(1)"） */
  cssPath: string
  /** 最短唯一 CSS 选择器（优先使用 ID > 类名组合） */
  uniqueSelector: string
  /** 框架组件信息（仅在 Vue/React 页面中有效） */
  framework?: FrameworkInfo
  /** 计算样式的子集 */
  computedStyle: Record<string, string>
}

/**
 * Inspector 配置选项
 *
 * @example
 * ```ts
 * const inspector = createInspector({
 *   color: '#ff6600',
 *   showInfoCard: true,
 *   onSelect: (result) => console.log(result),
 * })
 * ```
 */
export interface InspectorOptions {
  /**
   * 高亮框颜色（十六进制格式）
   * @default '#42b883' (Vue 绿)
   */
  color?: string

  /**
   * 高亮框背景透明度 (0 ~ 1)
   * @default 0.15
   */
  backgroundOpacity?: number

  /**
   * 是否显示悬浮信息卡片（显示组件名 + 尺寸）
   * @default true
   */
  showInfoCard?: boolean

  /**
   * 忽略的元素 CSS 选择器（匹配这些选择器的元素不会被高亮）
   * @default 忽略 inspector 自身 + body + html
   */
  ignoreSelector?: string

  /**
   * 按 Escape 键退出时是否自动销毁实例
   * - `true`: 调用 destroy()，需重新 createInspector
   * - `false`: 调用 stop()，可再次 start()
   * @default true
   */
  destroyOnEscape?: boolean

  /**
   * 选中元素后的回调
   * @param result - 选中的元素完整信息
   * @returns 返回 `false` 可阻止自动退出 inspect 模式；其他值或不返回则自动退出
   */
  onSelect?: (result: InspectResult) => void | boolean | Promise<void> | Promise<boolean>

  /**
   * 退出 inspect 模式时的回调（用户按 Escape 或取消操作触发）
   */
  onCancel?: () => void
}

/** Inspector 实例接口 */
export interface DomInspectorInstance {
  /** 启动 inspect 模式（鼠标悬停高亮，点击选中） */
  start(): void

  /** 停止 inspect 模式（保留实例，可重新调用 start()） */
  stop(): void

  /** 销毁实例（移除所有事件监听器和高亮 DOM，不可恢复） */
  destroy(): void

  /** 当前是否处于 inspect 模式中 */
  isInspecting(): boolean
}
