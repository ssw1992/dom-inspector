import type { FrameworkInfo } from '../types'

/**
 * 框架组件识别模块
 * 检测 Vue / React 组件实例并提取元信息
 */

/**
 * 检测元素所属的框架组件信息
 */
export function detectFramework(el: HTMLElement): FrameworkInfo | undefined {
  const vueInfo = detectVue(el)
  if (vueInfo) return vueInfo

  const reactInfo = detectReact(el)
  if (reactInfo) return reactInfo

  return undefined
}

// ---- Vue 检测 ----

function detectVue(el: HTMLElement): FrameworkInfo | undefined {
  // Vue 3: __vueParentComponent
  const vueComponent = (el as any).__vueParentComponent
  if (vueComponent) {
    const type = vueComponent.type
    const name = typeof type === 'string'
      ? type
      : type?.name || type?.__name || type?.type?.name || 'Anonymous'

    // 提取 props（过滤掉内部属性）
    const props = vueComponent.props ? filterVueProps(vueComponent.props) : undefined

    return { type: 'vue', name, props }
  }

  // Vue 2: __vue__
  const vue2Instance = (el as any).__vue__
  if (vue2Instance) {
    return {
      type: 'vue',
      name: vue2Instance.$options?.name || vue2Instance.$options?._componentTag || 'Anonymous',
      props: vue2Instance.$props ? { ...vue2Instance.$props } : undefined,
    }
  }

  return undefined
}

function filterVueProps(props: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {}
  for (const [key, value] of Object.entries(props)) {
    // 跳过 Vue 内部属性
    if (key.startsWith('__') || key.startsWith('$')) continue
    filtered[key] = value
  }
  return filtered
}

// ---- React 检测 ----

function detectReact(el: HTMLElement): FrameworkInfo | undefined {
  // React 18+: __reactFiber$xx 或 __reactInternalInstance$xx
  const fiberKey = Object.keys(el).find(k =>
    k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'),
  )

  if (!fiberKey) return undefined

  const fiber = (el as any)[fiberKey]
  if (!fiber) return undefined

  // 向上找到有名称的 Fiber 节点
  let current = fiber
  let name: string | undefined

  // 遍历 Fiber 树找组件名
  while (current) {
    // 函数组件: type 是函数，取函数名
    if (typeof current.type === 'function') {
      name = current.type.displayName || current.type.name
      if (name && name !== 'Anonymous') break
    }
    // 类组件/forwardRef/memo 等
    else if (current.type?.displayName) {
      name = current.type.displayName
      break
    } else if (current.type?.name) {
      name = current.type.name
      break
    }
    current = current.return
  }

  // 提取 props
  const props = fiber.memoizedProps
    ? filterReactProps(fiber.memoizedProps)
    : undefined

  return { type: 'react', name: name || 'Unknown', props }
}

function filterReactProps(props: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {}
  for (const [key, value] of Object.entries(props)) {
    // 跳过 React 内部属性
    if (key.startsWith('__') || key.startsWith('_')) continue
    if (typeof value === 'function') continue // 过滤事件处理等
    if (value === undefined) continue
    filtered[key] = value
  }
  return filtered
}
