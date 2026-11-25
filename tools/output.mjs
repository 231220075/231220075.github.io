import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'

const copyOptions = { recursive: true, verbatimSymlinks: true, mode: fs.constants.COPYFILE_FICLONE }
const remove = target => fs.rmSync(target, { recursive: true, force: true })

function withOutputLock(root, action) {
  const key = createHash('sha256').update(fs.realpathSync(root)).digest('hex').slice(0, 20)
  const lock = path.join(os.tmpdir(), `summer-flower-${key}.lock`)
  try {
    fs.mkdirSync(lock)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    throw new Error(`public/ 正在由另一个操作更新（锁：${lock}）`)
  }
  try {
    const output = path.join(root, 'public')
    const existing = fs.lstatSync(output, { throwIfNoEntry: false })
    if (existing && !existing.isDirectory()) throw new Error('public 必须是普通目录')
    return action(output, Boolean(existing))
  } finally {
    fs.rmdirSync(lock)
  }
}

function preserve(target, saved, undo) {
  if (!fs.lstatSync(target, { throwIfNoEntry: false })) {
    undo.push(() => remove(target))
    return
  }
  fs.mkdirSync(path.dirname(saved), { recursive: true })
  fs.cpSync(target, saved, copyOptions)
  undo.push(() => {
    remove(target)
    fs.cpSync(saved, target, copyOptions)
  })
}

function updateDirectory(source, target, backup, temporaryFile, undo) {
  const incoming = fs.readdirSync(source, { withFileTypes: true })
  const previous = new Map(fs.readdirSync(target, { withFileTypes: true }).map(entry => [entry.name, entry]))

  for (const entry of incoming) {
    const old = previous.get(entry.name)
    const from = path.join(source, entry.name)
    const to = path.join(target, entry.name)
    const saved = path.join(backup, entry.name)
    previous.delete(entry.name)

    if (entry.isDirectory() && old?.isDirectory()) {
      updateDirectory(from, to, saved, temporaryFile, undo)
    } else if (entry.isDirectory()) {
      preserve(to, saved, undo)
      remove(to)
      fs.cpSync(from, to, copyOptions)
    } else {
      if (old?.isFile() && fs.statSync(from).size === fs.statSync(to).size && fs.readFileSync(from).equals(fs.readFileSync(to))) continue
      preserve(to, saved, undo)
      if (old?.isDirectory()) remove(to)
      fs.copyFileSync(from, temporaryFile, fs.constants.COPYFILE_FICLONE)
      fs.renameSync(temporaryFile, to)
    }
  }

  for (const name of previous.keys()) {
    const stale = path.join(target, name)
    preserve(stale, path.join(backup, name), undo)
    remove(stale)
  }
}

export function installOutput(root, source) {
  withOutputLock(root, (output, exists) => {
    const scratch = fs.mkdtempSync(path.join(root, '.blog-build-'))
    const undo = []
    let keepBackup = false
    try {
      if (!exists) {
        fs.mkdirSync(output)
        undo.push(() => fs.rmdirSync(output))
      }
      updateDirectory(source, output, path.join(scratch, 'previous'), path.join(scratch, 'pending'), undo)
    } catch (error) {
      const failures = []
      for (const restore of undo.reverse()) {
        try { restore() } catch (failure) { failures.push(failure) }
      }
      if (failures.length) {
        keepBackup = true
        throw new AggregateError([error, ...failures], `更新 public/ 失败且未能完整恢复，备份保留在 ${scratch}`, { cause: error })
      }
      throw error
    } finally {
      if (!keepBackup) remove(scratch)
    }
  })
}

export function cleanOutput(root) {
  withOutputLock(root, (output, exists) => {
    if (!exists) return
    for (const name of fs.readdirSync(output)) remove(path.join(output, name))
  })
}
