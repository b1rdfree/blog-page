/**
 * 旅行数据集的「正文加载层」。
 *
 * 关键点：import.meta.glob 是**非 eager** 的，Vite 会为每份 .json 生成一个独立 chunk，
 * 只有真正 import() 时才下载。所以行程从 3 篇涨到 300 篇，首屏体积也几乎不变。
 */
import type { TripDataset } from './types'

const DIR = '../../content/travel'

/** 值是 `() => Promise<TripDataset>`，调用才加载 */
const loaders = import.meta.glob<TripDataset>('../../content/travel/*.json', {
  import: 'default',
})

/** 已加载过的数据集常驻内存，来回切换不重复请求 */
const cache = new Map<string, TripDataset>()

function loaderOf(slug: string) {
  return loaders[`${DIR}/${slug}.json`]
}

/** 预取：鼠标移到列表项上时调用，把网络请求提前到点击之前 */
export function prefetchTrip(slug: string): void {
  if (cache.has(slug)) return
  const load = loaderOf(slug)
  if (!load) return
  void load()
    .then((data) => cache.set(slug, data))
    .catch(() => {
      /* 预取失败无所谓，真正点击时还会再试一次 */
    })
}

export async function loadTrip(slug: string): Promise<TripDataset | null> {
  const hit = cache.get(slug)
  if (hit) return hit

  const load = loaderOf(slug)
  if (!load) return null

  const data = await load()
  cache.set(slug, data)
  return data
}
