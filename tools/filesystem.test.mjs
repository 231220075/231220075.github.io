import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePath, readDirectory, resolveFile, completePath, parseList, unquote } from '../assets/js/filesystem.mjs'

const post = { type: 'file', name: 'Rust 笔记.md', title: 'Rust 笔记', url: '/2025/01/02/rust/', date: '2025-01-02', tags: ['Rust'] }
const about = { type: 'file', name: 'about.md', title: '关于', url: '/about/' }
const directory = (name, url) => ({ type: 'directory', name, url })
const directories = {
  '/': { url: '/', entries: [directory('posts', '/archives/'), directory('tags', '/tags/'), directory('categories', '/categories/'), about] },
  '/posts': { url: '/archives/', entries: [post] },
  '/tags': { url: '/tags/', entries: [directory('Rust', '/tags/Rust/')] },
  '/tags/Rust': { url: '/tags/Rust/', entries: [post] },
  '/categories': { url: '/categories/', entries: [directory('技术', '/categories/技术/'), directory('computer science', '/categories/computer-science/')] },
  '/categories/技术': { url: '/categories/技术/', entries: [post] },
  '/categories/computer science': { url: '/categories/computer-science/', entries: [] },
}

test('root lists files and folders; post and tag views use the same article URL', () => {
  const root = readDirectory(directories, '/')
  assert.equal(root.path, '/')
  assert.deepEqual(root.entries.map(e => e.name), ['posts', 'tags', 'categories', 'about.md'])
  assert.equal(readDirectory(directories, '/posts', '../tags/Rust').entries[0].url, post.url)
  assert.equal(readDirectory(directories, '/posts').entries[0].url, post.url)
  assert.throws(() => readDirectory(directories, '/posts', 'missing'), /目录不存在/)
})

test('relative, absolute and quoted paths resolve without escaping home', () => {
  assert.equal(normalizePath('/posts', '..'), '/')
  assert.equal(normalizePath('/posts', '../../..'), '/')
  assert.equal(normalizePath('/posts', '../tags/Rust/./'), '/tags/Rust')
  assert.equal(normalizePath('/posts', '~/tags'), '/tags')
  assert.equal(normalizePath('/posts', '~'), '/')
  assert.equal(readDirectory(directories, '/', unquote('"categories/computer science"')).path, '/categories/computer science')
  assert.equal(unquote(JSON.stringify('含 "引号" 的文章.md')), '含 "引号" 的文章.md')
})

test('old category shortcuts and bare filenames still resolve from home', () => {
  assert.equal(readDirectory(directories, '/', '技术').path, '/categories/技术')
  assert.deepEqual(resolveFile(directories, '/', 'Rust 笔记.md'), post)
  assert.deepEqual(resolveFile(directories, '/', '技术/Rust 笔记.md'), post)
  assert.deepEqual(resolveFile(directories, '/tags/Rust', '../../about.md'), about)
  assert.deepEqual(resolveFile(directories, '/posts', 'Rust 笔记.md'), post)
  assert.equal(resolveFile(directories, '/', 'missing.md'), null)
  assert.equal(resolveFile(directories, '/', 'https://example.com'), null)
})

test('path completion handles nested, relative and quoted paths', () => {
  assert.deepEqual(completePath(directories, '/', 'p', true), ['posts/'])
  assert.deepEqual(completePath(directories, '/posts', '../tags/R', true), ['../tags/Rust/'])
  assert.deepEqual(completePath(directories, '/', '"categories/computer s', true), ['categories/computer science/'])
  assert.deepEqual(completePath(directories, '/posts', 'Rust'), ['Rust 笔记.md'])
  assert.deepEqual(completePath(directories, '/', '/posts/Rust'), ['/posts/Rust 笔记.md'])
  assert.deepEqual(completePath(directories, '/posts', 'Rust', true), [])
  assert.deepEqual(completePath(directories, '/', '/missing/'), [])
})

test('ls accepts options on either side of a directory and preserves quoted spaces', () => {
  assert.deepEqual(parseList('-l posts/ -t RuSt'), { target: 'posts/', long: true, tag: 'rust' })
  assert.deepEqual(parseList('-t "GitHub Pages" "categories/computer science" -l'), { target: 'categories/computer science', long: true, tag: 'github pages' })
  assert.throws(() => parseList('posts -t -l'), /需要标签名/)
  assert.throws(() => parseList('posts -z'), /未知参数/)
})
