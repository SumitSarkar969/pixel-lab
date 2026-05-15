/* eslint-disable no-restricted-globals */
// Classic Web Worker — hosts Pyodide off the main thread.
// Loaded by src/lib/pyodide-client.js.

const PYODIDE_VERSION = 'v0.26.4'
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

self.importScripts(PYODIDE_BASE + 'pyodide.js')

let pyodide = null
let processFn = null
let initPromise = null

async function bootstrap(filtersSrc) {
  pyodide = await self.loadPyodide({ indexURL: PYODIDE_BASE })
  await pyodide.loadPackage(['numpy', 'Pillow'])
  pyodide.runPython(filtersSrc)
  processFn = pyodide.globals.get('process')
}

self.onmessage = async (e) => {
  const { id, type, payload } = e.data
  try {
    if (type === 'init') {
      initPromise = bootstrap(payload.filtersSrc)
      await initPromise
      self.postMessage({ id, type: 'ready' })
      return
    }

    if (initPromise) await initPromise

    if (type === 'process') {
      const { buf, w, h, method, params } = payload
      const u8 = new Uint8Array(buf)
      const result = processFn(u8, w, h, method, JSON.stringify(params || {}))

      let outBytes
      if (result instanceof Uint8Array) {
        outBytes = result
      } else if (result && typeof result.toJs === 'function') {
        outBytes = result.toJs()
        if (typeof result.destroy === 'function') result.destroy()
      } else {
        throw new Error('Unexpected result type from Python')
      }

      const outBuf = outBytes.buffer.slice(
        outBytes.byteOffset,
        outBytes.byteOffset + outBytes.byteLength,
      )
      self.postMessage(
        { id, type: 'result', payload: { buf: outBuf, w, h } },
        [outBuf],
      )
      return
    }

    throw new Error(`Unknown message type: ${type}`)
  } catch (err) {
    self.postMessage({
      id,
      type: 'error',
      payload: { message: err && err.message ? err.message : String(err) },
    })
  }
}
