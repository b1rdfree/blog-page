/**
 * 构建期生成的虚拟模块类型声明。
 *
 * 注意：本文件必须保持「全局脚本」形态（顶层不能有 import/export），
 * 否则 `declare module` 会被当成模块增强而要求原模块已存在。
 * 所以类型用块内 `import type` 引入。
 */
declare module 'virtual:travel-index' {
  import type { TripMeta } from '../lib/travel/types'

  /** 由 build/travelIndexPlugin.ts 扫描 src/content/travel/*.json 生成 */
  const travelIndex: TripMeta[]
  export default travelIndex
  export { travelIndex }
}
