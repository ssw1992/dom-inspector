import type { DomRect } from '../types'

/**
 * 高亮框渲染引擎
 * 负责创建、更新、销毁页面上的高亮覆盖层
 */

const CONTAINER_ID = '__dom_inspector_overlay__'
const CARD_ID = '__dom_inspector_card__'
const NAME_ID = '__dom_inspector_name__'
const SIZE_ID = '__dom_inspector_size__'

interface OverlayStyle {
  color: string
  bgOpacity: number
  showCard: boolean
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getContainer(): HTMLDivElement | null {
  return document.getElementById(CONTAINER_ID) as HTMLDivElement | null
}

function createContainer(style: OverlayStyle): HTMLDivElement {
  // 移除已存在的
  getContainer()?.remove()

  const container = document.createElement('div')
  container.id = CONTAINER_ID
  container.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    pointer-events: none;
    transition: all 0.08s ease-in;
    border: 1px solid ${hexToRgba(style.color, 0.5)};
    border-radius: 3px;
    background: ${hexToRgba(style.color, style.bgOpacity)};
    display: none;
  `

  if (style.showCard) {
    const card = document.createElement('div')
    card.id = CARD_ID
    card.style.cssText = `
      position: absolute;
      left: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 20px;
      padding: 2px 6px;
      color: #fff;
      background: ${style.color};
      border-radius: 2px 2px 0 0;
      white-space: nowrap;
      transform: translateY(-100%);
    `

    const nameSpan = document.createElement('span')
    nameSpan.id = NAME_ID
    card.appendChild(nameSpan)

    const sizeSpan = document.createElement('span')
    sizeSpan.id = SIZE_ID
    sizeSpan.style.cssText = `opacity: 0.6; margin-left: 6px;`
    card.appendChild(sizeSpan)

    container.appendChild(card)
  }

  document.body.appendChild(container)
  return container
}

function updatePosition(rect: DomRect): void {
  const container = getContainer()
  if (!container) return

  container.style.display = 'block'
  container.style.left = `${rect.left}px`
  container.style.top = `${rect.top}px`
  container.style.width = `${rect.width}px`
  container.style.height = `${rect.height}px`

  // 信息卡片位置：如果空间不够就放到下方
  const card = document.getElementById(CARD_ID)
  if (card) {
    card.style.top = rect.top < 28 ? '0' : ''
    card.style.transform = rect.top < 28 ? 'translateY(0)' : 'translateY(-100%)'
  }
}

function updateInfo(name: string, width: number, height: number): void {
  const nameEl = document.getElementById(NAME_ID)
  const sizeEl = document.getElementById(SIZE_ID)
  if (nameEl) nameEl.textContent = `<${name}>`
  if (sizeEl) sizeEl.textContent = `${Math.round(width)} × ${Math.round(height)}`
}

/** 显示高亮框 */
export function showHighlight(rect: DomRect, style: OverlayStyle, label?: string): void {
  let container = getContainer()
  if (!container) {
    container = createContainer(style)
  }
  updatePosition(rect)
  if (label && style.showCard) {
    updateInfo(label, rect.width, rect.height)
  }
}

/** 隐藏高亮框 */
export function hideHighlight(): void {
  const el = getContainer()
  if (el) el.style.display = 'none'
}

/** 销毁高亮框（移除 DOM） */
export function destroyHighlight(): void {
  getContainer()?.remove()
}
