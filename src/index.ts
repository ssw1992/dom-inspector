import type {
  InspectorOptions,
  InspectResult,
  DomRect,
  FrameworkInfo,
  DomInspectorInstance,
} from './types'
import { showHighlight, hideHighlight, destroyHighlight } from './core/highlighter'
import { getCssPath, getUniqueSelector, getComputedStyles } from './core/path-analyzer'
import { detectFramework } from './core/framework-detector'

// ============================================================
// DOM Inspector — 纯网页版元素检查器
//
// 零依赖、零配置、零侵入的通用 DOM 元素选取工具。
// 支持 hover 高亮、点击选中、CSS 路径生成、Vue/React 组件识别。
//
// @example
// ```ts
// import { createInspector } from 'dom-inspector'
//
// const inspector = createInspector({
//   onSelect: (result) => {
//     console.log('选中了:', result.tagName, result.cssPath)
//     console.log('Vue/React 组件:', result.framework)
//   },
// })
//
// inspector.start()  // 启动
// inspector.stop()   // 停止
// inspector.destroy() // 销毁
// ```
// ============================================================

type InspectState = 'idle' | 'inspecting'

const DEFAULT_OPTIONS: Required<Omit<InspectorOptions, 'onSelect' | 'onCancel'>> = {
  color: '#42b883',
  backgroundOpacity: 0.15,
  showInfoCard: true,
  ignoreSelector: `#${CSS.escape('__dom_inspector_overlay__')}, body, html`,
  destroyOnEscape: true,
}

/** 解析用户选项，填充默认值 */
function resolveOptions(options?: InspectorOptions): Required<InspectorOptions> {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    onSelect: options?.onSelect ?? (() => {}),
    onCancel: options?.onCancel ?? (() => {}),
  }
}

/** 从 HTMLElement 获取边界矩形 */
function getRect(el: HTMLElement): DomRect {
  const r = el.getBoundingClientRect()
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    right: r.right,
    bottom: r.bottom,
  }
}

/** 检查元素是否应被忽略 */
function shouldIgnore(el: Element, ignoreSelector: string): boolean {
  try {
    return el.matches(ignoreSelector)
  } catch {
    return false
  }
}

/** 构建完整的 InspectResult */
function buildInspectResult(el: HTMLElement): InspectResult {
  const rect = getRect(el)

  return {
    element: el,
    tagName: el.tagName.toLowerCase(),
    id: el.id,
    classNames: Array.from(el.classList),
    rect,
    cssPath: getCssPath(el),
    uniqueSelector: getUniqueSelector(el),
    framework: detectFramework(el),
    computedStyle: getComputedStyles(el),
  }
}

/**
 * 创建一个 DOM Inspector 实例
 *
 * 返回一个可控制生命周期的方法对象。
 * 同一时刻只应有一个活跃的 Inspector 实例。
 *
 * @param options - 配置选项（可选）
 * @returns Inspector 实例，包含 start / stop / destroy / isInspecting 方法
 *
 * @example
 * ```ts
 * // 基础用法
 * const insp = createInspector()
 * insp.start()       // 开始 inspect
 * insp.stop()        // 暂停（可重新 start）
 * insp.destroy()     // 彻底销毁
 * ```
 *
 * @example
 * ```ts
 * // 自定义高亮颜色和回调
 * const insp = createInspector({
 *   color: '#ff6600',
 *   showInfoCard: true,
 *   onSelect: (r) => {
 *     console.log(r.uniqueSelector)  // "#app > .header"
 *     console.log(r.framework?.name) // "Header" (Vue/React 组件名)
 *     return false // 不自动退出，可继续选择
 *   },
 * })
 * ```
 */
export function createInspector(options?: InspectorOptions): DomInspectorInstance {
  const opts = resolveOptions(options)
  let state: InspectState = 'idle'
  let currentEl: HTMLElement | null = null

  // ---- 事件处理函数（保持引用以便移除） ----

  function onMouseOver(e: MouseEvent): void {
    if (state !== 'inspecting') return

    const target = e.target as HTMLElement | null
    if (!target || shouldIgnore(target, opts.ignoreSelector)) return

    currentEl = target
    const rect = getRect(target)

    const label = opts.showInfoCard ? target.tagName.toLowerCase() : undefined
    showHighlight(
      rect,
      { color: opts.color, bgOpacity: opts.backgroundOpacity, showCard: opts.showInfoCard },
      label,
    )
  }

  async function onClick(e: MouseEvent): Promise<void> {
    if (state !== 'inspecting' || !currentEl) return

    e.preventDefault()
    e.stopPropagation()

    const result = buildInspectResult(currentEl)

    // 调用回调，如果返回 false 则不自动退出
    const shouldStop = (await opts.onSelect(result)) !== false
    if (shouldStop) {
      stopInternal()
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (state !== 'inspecting') return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      opts.onCancel()
      if (opts.destroyOnEscape) {
        destroyInternal()
      } else {
        stopInternal()
      }
    }
  }

  // ---- 内部状态管理 ----

  function bindEvents(): void {
    document.addEventListener('mouseover', onMouseOver, { passive: true })
    document.addEventListener('click', onClick, true) // capture 阶段拦截
    document.addEventListener('keydown', onKeyDown, true)
  }

  function unbindEvents(): void {
    document.removeEventListener('mouseover', onMouseOver)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKeyDown, true)
  }

  /** 停止但保留实例 */
  function stopInternal(): void {
    state = 'idle'
    currentEl = null
    unbindEvents()
    hideHighlight()
  }

  /** 完全销毁 */
  function destroyInternal(): void {
    state = 'idle'
    currentEl = null
    unbindEvents()
    destroyHighlight()
  }

  // ---- 公开 API ----

  function start(): void {
    if (state === 'inspecting') return
    state = 'inspecting'
    bindEvents()
  }

  function stop(): void {
    if (state !== 'inspecting') return
    stopInternal()
  }

  function destroy(): void {
    destroyInternal()
  }

  function isInspecting(): boolean {
    return state === 'inspecting'
  }

  return { start, stop, destroy, isInspecting }
}

// ============================================================
// 便捷导出：一次性 inspect（Promise 模式）
// ============================================================

/**
 * 一次性 inspect：启动后等待用户选择，返回 Promise\<InspectResult\>
 *
 * 用户点击选中元素后 Promise resolve；按 Escape 后 reject。
 *
 * @param options - 配置选项（不支持 onSelect，因为结果通过 Promise 返回）
 * @returns Promise\<InspectResult\> — 选中的元素信息
 *
 * @example
 * ```ts
 * try {
 *   const result = await inspectOnce({ color: '#ff6600' })
 *   console.log(result.uniqueSelector)
 *   console.log(result.framework?.name) // Vue/React 组件名
 * } catch (e) {
 *   console.log('用户取消了')
 * }
 * ```
 */
export function inspectOnce(
  options?: Omit<InspectorOptions, 'onSelect'>,
): Promise<InspectResult> {
  return new Promise((resolve, reject) => {
    const instance = createInspector({
      ...options,
      onSelect: (result) => {
        resolve(result)
        return true // 自动退出
      },
      onCancel: () => {
        reject(new Error('Inspector cancelled by user'))
      },
    })
    instance.start()
  })
}

// ============================================================
// 子模块导出（供高级用法直接使用）
// ============================================================

/** 类型导出 */
export type {
  InspectorOptions,
  InspectResult,
  DomRect,
  FrameworkInfo,
  DomInspectorInstance,
  VueFrameworkInfo,
  ReactFrameworkInfo,
} from './types'

/** 子模块：DOM 路径分析 */
export { getCssPath, getUniqueSelector, getComputedStyles } from './core/path-analyzer'

/** 子模块：框架组件检测 */
export { detectFramework } from './core/framework-detector'
