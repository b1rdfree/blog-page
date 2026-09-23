import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

// Guard the synchronous entry graph, not all lazy chunks combined.
// Run via pnpm check:perf so the manifest and assets come from the same build.
const dist = resolve('dist')
const manifest = JSON.parse(readFileSync(resolve(dist, '.vite/manifest.json'), 'utf8'))
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry)
assert(entry, 'Build manifest has no entry')
const seen = new Set()
const js = new Set()
const css = new Set()
function visit(key) {
  if (seen.has(key)) return
  seen.add(key)
  const chunk = manifest[key]
  assert(chunk, `Missing manifest chunk: ${key}`)
  js.add(chunk.file)
  for (const file of chunk.css ?? []) css.add(file)
  for (const dependency of chunk.imports ?? []) visit(dependency)
}
visit(entry)
const sizeOf = (files) => [...files].reduce((sum, file) => sum + gzipSync(readFileSync(resolve(dist, file))).length, 0)
const jsBytes = sizeOf(js)
const cssBytes = sizeOf(css)
assert(jsBytes <= 65000, `Initial JS exceeds 65 KB gzip: ${jsBytes} bytes`)
assert(cssBytes <= 5000, `Initial CSS exceeds 5 KB gzip: ${cssBytes} bytes`)
for (const file of js) {
  assert(!/(?:MoltenMetal|background|markdown|anim)-/.test(file), `Deferred code became synchronous: ${file}`)
}
console.log(`Initial JS: ${(jsBytes / 1000).toFixed(2)} KB gzip (budget: 65 KB)`)
console.log(`Initial CSS: ${(cssBytes / 1000).toFixed(2)} KB gzip (budget: 5 KB)`)
console.log('Deferred background and Markdown remain outside the initial dependency graph.')
