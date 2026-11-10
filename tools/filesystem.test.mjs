import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePath, readDirectory, resolveFile, completePath } from '../assets/js/filesystem.mjs'

const file = { name: 'Rust 笔记.md', title: 'Rust 笔记', url: '/2025/01/02/rust/', date: '2025-01-02' }
const directories = [
  { name: '学习记录', url: '/categories/学习记录/', files: [file] },
  { name: '技术', url: '/categories/技术/', files: [file, { name: 'other.md', url: '/other/' }] },
  { name: 'computer science', url: '/categories/computer-science/', files: [] },
]

test('root lists categories; category paths list only their posts', () => {
  const root = readDirectory(directories, '/')
  assert.equal(root.path, '/')
  assert.deepEqual(root.entries.map(e => [e.type, e.name]), [['directory', '学习记录'], ['directory', '技术'], ['directory', 'computer science']])
  const category = readDirectory(directories, '/', '学习记录/')
  assert.equal(category.path, '/学习记录')
  assert.deepEqual(category.entries.map(e => [e.type, e.name]), [['file', 'Rust 笔记.md']])
  assert.throws(() => readDirectory(directories, '/学习记录', 'missing'), /目录不存在/)
})

test('relative, absolute, quoted and home paths normalize without escaping root', () => {
  assert.equal(normalizePath('/学习记录', '..'), '/')
  assert.equal(normalizePath('/学习记录', '../../..'), '/')
  assert.equal(normalizePath('/学习记录', '../技术/./'), '/技术')
  assert.equal(normalizePath('/学习记录', '~/技术'), '/技术')
  assert.equal(normalizePath('/学习记录', '~'), '/')
  assert.equal(readDirectory(directories, '/', '"computer science"').path, '/computer science')
  assert.equal(readDirectory(directories, '/', "'学习记录'").path, '/学习记录')
})

test('open resolves filenames with spaces, absolute paths and shared category entries', () => {
  assert.deepEqual(resolveFile(directories, '/学习记录', '"Rust 笔记.md"'), file)
  assert.deepEqual(resolveFile(directories, '/', 'Rust 笔记.md'), file)
  assert.deepEqual(resolveFile(directories, '/技术', '/学习记录/Rust 笔记.md'), file)
  assert.equal(resolveFile(directories, '/', 'missing.md'), null)
  assert.equal(resolveFile(directories, '/', 'https://example.com'), null)
  const ambiguous = [{ name: 'one', files: [{ name: 'same.md', url: '/one/' }] }, { name: 'two', files: [{ name: 'same.md', url: '/two/' }] }]
  assert.equal(resolveFile(ambiguous, '/', 'same.md'), null)
  assert.equal(resolveFile(ambiguous, '/one', 'same.md').url, '/one/')
})

test('path completion supports directories and filenames without changing cwd', () => {
  assert.deepEqual(completePath(directories, '/', '学', true), ['学习记录/'])
  assert.deepEqual(completePath(directories, '/技术', '../学', true), ['../学习记录/'])
  assert.deepEqual(completePath(directories, '/学习记录', 'Rust'), ['Rust 笔记.md'])
  assert.deepEqual(completePath(directories, '/', '/学习记录/Rust'), ['/学习记录/Rust 笔记.md'])
  assert.deepEqual(completePath(directories, '/学习记录', 'Rust', true), [])
  assert.deepEqual(completePath(directories, '/', '/missing/'), [])
})
