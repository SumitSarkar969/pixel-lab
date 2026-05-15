// Singleton wrapper around the Pyodide worker.
// Handles image <-> ImageData conversion on the main thread, and request/response
// correlation with the worker via numeric message IDs.

import filtersSrc from '../python/filters.py?raw'

let _client = null

class PyodideClient {
  constructor() {
    this.worker = new Worker(
      new URL('../worker/pyodide.worker.js', import.meta.url),
    )
    this.nextId = 0
    this.pending = new Map()
    this.status = 'loading'
    this.errorMessage = null
    this.listeners = new Set()

    this.worker.onmessage = (e) => this._onMessage(e)
    this.worker.onerror = (e) => this._setStatus('error', e.message || 'Worker error')

    this.readyPromise = this._send('init', { filtersSrc })
      .then(() => this._setStatus('ready'))
      .catch((err) => {
        this._setStatus('error', err.message || String(err))
        throw err
      })
  }

  onStatusChange(fn) {
    this.listeners.add(fn)
    fn(this.status, this.errorMessage)
    return () => this.listeners.delete(fn)
  }

  _setStatus(s, msg = null) {
    this.status = s
    this.errorMessage = msg
    this.listeners.forEach((fn) => fn(s, msg))
  }

  _onMessage(e) {
    const { id, type, payload } = e.data
    const handler = this.pending.get(id)
    if (!handler) return
    this.pending.delete(id)
    if (type === 'error') handler.reject(new Error(payload.message))
    else handler.resolve(payload)
  }

  _send(type, payload, transfer = []) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage({ id, type, payload }, transfer)
    })
  }

  async process(imageURL, method, params) {
    await this.readyPromise
    const { buf, w, h } = await urlToImageData(imageURL)
    const result = await this._send(
      'process',
      { buf, w, h, method, params },
      [buf],
    )
    const gray = new Uint8Array(result.buf)
    const histogram = computeHistogram(gray)
    const { mean, std } = computeStats(gray)
    const url = await imageDataToBlobURL(result.buf, result.w, result.h)
    return { url, histogram, w: result.w, h: result.h, mean, std }
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image: ' + url))
    img.src = url
  })
}

async function urlToImageData(url) {
  const img = await loadImage(url)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  if (!w || !h) throw new Error('Image has zero dimensions')
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const rgba = ctx.getImageData(0, 0, w, h).data
  // Collapse RGBA → 1-channel grayscale using BT.601 luma weights.
  const gray = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = Math.round(0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2])
  }
  return { buf: gray.buffer.slice(0), w, h }
}

function imageDataToBlobURL(buf, w, h) {
  // Expand 1-channel grayscale → RGBA so the Canvas API can display it.
  const gray = new Uint8Array(buf)
  const rgba = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4]     = gray[i]
    rgba[i * 4 + 1] = gray[i]
    rgba[i * 4 + 2] = gray[i]
    rgba[i * 4 + 3] = 255
  }
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.putImageData(new ImageData(rgba, w, h), 0, 0)
  return new Promise((resolve) =>
    c.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/png'),
  )
}

function computeHistogram(gray) {
  const counts = new Float32Array(256)
  for (let i = 0; i < gray.length; i++) counts[gray[i]]++
  let max = 0
  for (let i = 0; i < 256; i++) if (counts[i] > max) max = counts[i]
  if (max > 0) for (let i = 0; i < 256; i++) counts[i] /= max
  return counts
}

function computeStats(gray) {
  const n = gray.length
  let sum = 0
  for (let i = 0; i < n; i++) sum += gray[i]
  const mean = sum / n
  let sq = 0
  for (let i = 0; i < n; i++) sq += (gray[i] - mean) ** 2
  return { mean: +mean.toFixed(1), std: +(Math.sqrt(sq / n)).toFixed(1) }
}

export function getPyodideClient() {
  if (!_client) _client = new PyodideClient()
  return _client
}
