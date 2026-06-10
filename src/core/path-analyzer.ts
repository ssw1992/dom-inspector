/**
 * DOM 路径分析模块
 * 生成 CSS 选择器路径、最短唯一选择器等
 */

/**
 * 从元素向上遍历，生成 CSS 路径
 */
export function getCssPath(el: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = el

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      selector += `#${current.id}`
      parts.unshift(selector)
      break // ID 通常已经唯一，可以停止
    }

    if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList).join('.')}`
    }

    // 加上同级中的位置索引来保证唯一性
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        c => c.tagName === current!.tagName,
      )
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${idx})`
      }
    }

    parts.unshift(selector)
    current = current.parentElement
  }

  return parts.join(' > ')
}

/**
 * 尝试生成最短的唯一 CSS 选择器
 * 策略：ID > 类名组合 > tag + 属性 + nth-of-type
 */
export function getUniqueSelector(el: HTMLElement): string {
  // 1. 如果有 ID，直接用
  if (el.id) {
    const byId = document.querySelectorAll(`#${CSS.escape(el.id)}`)
    if (byId.length === 1) return `#${CSS.escape(el.id)}`
  }

  // 2. 尝试类名组合
  if (el.classList.length > 0) {
    const classes = Array.from(el.classList)
    // 从少到多尝试类名组合
    for (let len = 1; len <= classes.length; len++) {
      const combo = classes.slice(0, len).map(c => CSS.escape(c)).join('.')
      const selector = `${el.tagName.toLowerCase()}.${combo}`
      const matches = document.querySelectorAll(selector)
      if (matches.length === 1) return selector
    }
  }

  // 3. 回退到完整路径
  return getCssPath(el)
}

/**
 * 获取元素的简化样式信息
 */
export function getComputedStyles(el: HTMLElement): Record<string, string> {
  const cs = getComputedStyle(el)
  return {
    display: cs.display,
    position: cs.position,
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    fontSize: cs.fontSize,
    margin: cs.margin,
    padding: cs.padding,
  }
}
