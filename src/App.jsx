import { useState, useRef, useEffect } from 'react'
import Icon from './components/icons.jsx'
import MenuBar from './components/MenuBar.jsx'
import MethodsSidebar from './components/MethodsSidebar.jsx'
import CanvasArea from './components/CanvasArea.jsx'
import ScopePanel from './components/ScopePanel.jsx'
import ControlsPanel from './components/ControlsPanel.jsx'
import StatusBar from './components/StatusBar.jsx'
import { usePyodide } from './hooks/usePyodide.js'
import './styles/global.css'

function makeLabel(method, params) {
  switch (method) {
    case 'gaussian':    return `Gaussian σ=${params.sigma} · ${params.k}×${params.k}`
    case 'median':      return `Median ${params.k}×${params.k}`
    case 'mean':        return `Mean ${params.k}×${params.k}`
    case 'threshold':   return params.method === 'otsu' ? 'Threshold · Otsu' : params.method === 'adaptive' ? 'Threshold · Adaptive' : `Threshold T=${params.t}`
    case 'gamma':       return `Gamma γ=${params.gamma}`
    case 'log':         return `Log c=${params.c}`
    case 'global-eq':   return 'Global equalization'
    case 'clahe':       return `CLAHE ${params.tileR}×${params.tileC}`
    case 'stretch':     return `Stretch ${params.lowPct}–${params.highPct}%`
    case 'contrast':    return `Contrast ${params.lowPct}–${params.highPct}%`
    case 'negative':    return 'Negative'
    case 'piecewise':   return 'Piecewise linear'
    case 'gray-slice':  return 'Gray-level slicing'
    case 'bit-plane':   return `Bit-plane [${params.planes.join(',')}]`
    case 'laplacian':   return `Laplacian ${params.kernel}-conn`
    case 'sobel':       return `Sobel ${params.dir}`
    case 'unsharp':     return `Unsharp r=${params.radius}`
    case 'ideal-lp':    return `Ideal LP D₀=${params.d0}`
    case 'butter-lp':   return `Butterworth LP D₀=${params.d0}`
    case 'gaussian-lp': return `Gaussian LP D₀=${params.d0}`
    case 'ideal-hp':    return `Ideal HP D₀=${params.d0}`
    case 'butter-hp':   return `Butterworth HP D₀=${params.d0}`
    case 'notch':       return `Notch (${params.u0},${params.v0})`
    case 'homomorphic': return `Homomorphic D₀=${params.d0}`
    case 'match-hist':  return 'Histogram matching'
    default:            return method
  }
}

function revokeEntries(entries) {
  entries.forEach(e => { if (e.imgSrc?.startsWith('blob:')) URL.revokeObjectURL(e.imgSrc) })
}

export default function App() {
  const [tool,        setTool]        = useState('hand')
  const [zoom,        setZoom]        = useState(1)
  const [compareMode, setCompareMode] = useState('after')
  const [scopeView,   setScopeView]   = useState('histogram')

  const [openCategories, setOpenCategories] = useState(['histogram', 'spatial'])
  const [activeMethod,   setActiveMethod]   = useState('gaussian')

  const [history,          setHistory]          = useState([])
  const [currentHistoryIdx, setCurrentHistoryIdx] = useState(-1)
  const [jumpSignal,        setJumpSignal]        = useState(0)
  const openTimeRef = useRef(null)

  const [imgSrc,  setImgSrc]  = useState(null)
  const [imgName, setImgName] = useState(null)

  const [processedSrc, setProcessedSrc] = useState(null)
  const [previewSrc,   setPreviewSrc]   = useState(null)
  const [applying,     setApplying]     = useState(false)
  const [applyError,   setApplyError]   = useState(null)
  const previewRunningRef = useRef(false)
  const pendingPreviewRef = useRef(null)

  const [imgHistogram,       setImgHistogram]       = useState(null)
  const [processedHistogram, setProcessedHistogram] = useState(null)
  const [imgDimensions,      setImgDimensions]      = useState(null)
  const [imgStats,           setImgStats]           = useState(null)
  const [processedStats,     setProcessedStats]     = useState(null)

  const pyodide = usePyodide()
  const { run: pyRun } = pyodide

  useEffect(() => {
    return () => {
      if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc)
      }
    }
  }, [imgSrc])

  const [leftW,  setLeftW]  = useState(240)
  const [rightW, setRightW] = useState(340)
  const drag = useRef(null)

  const onResizeDown = (which) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { which, startX: e.clientX, start: which === 'left' ? leftW : rightW }
  }
  const onResizeMove = (e) => {
    if (!drag.current) return
    const { which, startX, start } = drag.current
    const dx = e.clientX - startX
    if (which === 'left')  setLeftW(Math.max(180, Math.min(480, start + dx)))
    else                   setRightW(Math.max(260, Math.min(560, start - dx)))
  }
  const onResizeUp = (e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    drag.current = null
  }

  const dftFilter =
    activeMethod?.includes('hp') ? 'hp' :
    activeMethod?.includes('lp') ? 'lp' :
    null

  const toggleCategory = (id) =>
    setOpenCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const selectMethod = (id, cat) => {
    setActiveMethod(id)
    if (cat === 'frequency')  setScopeView('dft')
    else if (cat === 'histogram') setScopeView('histogram')
  }

  const clearPreview = () => {
    setPreviewSrc(prev => { if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev); return null })
  }

  const handleOpenImage = async (url, name) => {
    setImgName(name)
    setProcessedSrc(null)
    clearPreview()
    setProcessedHistogram(null)
    setProcessedStats(null)
    setApplyError(null)
    try {
      const { url: gray, histogram, w, h, mean, std } = await pyRun(url, 'grayscale', {})
      // Revoke all previous filter-result blobs before replacing history
      setHistory(prev => { revokeEntries(prev.filter(e => e.imgSrc)); return [] })
      setImgSrc(gray)
      setImgHistogram(histogram)
      setImgDimensions({ w, h })
      setImgStats({ mean, std })
      openTimeRef.current = Date.now()
      const entry = { label: `Open · ${name}`, time: '0s', imgSrc: null, histogram, stats: { mean, std } }
      setHistory([entry])
      setCurrentHistoryIdx(0)
    } catch (err) {
      setApplyError(err.message || String(err))
    } finally {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }

  const handleSaveImage = () => {
    const a = document.createElement('a')
    a.href = processedSrc || imgSrc
    a.download = imgName
    a.click()
  }

  const handleApply = async (method, params) => {
    if (!pyodide.ready || applying || !imgSrc) return
    setApplying(true)
    setApplyError(null)
    try {
      const srcToProcess = processedSrc ?? imgSrc
      const { url, histogram, mean, std } = await pyodide.run(srcToProcess, method, params)
      const elapsed = openTimeRef.current ? `+${((Date.now() - openTimeRef.current) / 1000).toFixed(1)}s` : ''
      const entry = { label: makeLabel(method, params), time: elapsed, imgSrc: url, histogram, stats: { mean, std } }
      setHistory(prev => {
        const kept = prev.slice(0, currentHistoryIdx + 1)
        revokeEntries(prev.slice(currentHistoryIdx + 1))
        return [...kept, entry]
      })
      setCurrentHistoryIdx(prev => prev + 1)
      clearPreview()
      setProcessedSrc(url)
      setProcessedHistogram(histogram)
      setProcessedStats({ mean, std })
    } catch (err) {
      setApplyError(err.message || String(err))
    } finally {
      setApplying(false)
    }
  }

  const handlePreview = async (method, params) => {
    if (method === null) { clearPreview(); return }
    if (!pyodide.ready || !imgSrc) return

    pendingPreviewRef.current = { method, params, src: processedSrc ?? imgSrc }
    if (previewRunningRef.current) return

    previewRunningRef.current = true
    try {
      while (pendingPreviewRef.current) {
        const req = pendingPreviewRef.current
        pendingPreviewRef.current = null
        try {
          const { url } = await pyodide.run(req.src, req.method, req.params)
          if (pendingPreviewRef.current) {
            if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
          } else {
            setPreviewSrc(prev => { if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev); return url })
          }
        } catch (_) { pendingPreviewRef.current = null }
      }
    } finally {
      previewRunningRef.current = false
    }
  }

  const handleJump = (idx) => {
    const entry = history[idx]
    if (!entry) return
    clearPreview()
    setCurrentHistoryIdx(idx)
    if (!entry.imgSrc) {
      setProcessedSrc(null)
      setProcessedHistogram(null)
      setProcessedStats(null)
    } else {
      setProcessedSrc(entry.imgSrc)
      setProcessedHistogram(entry.histogram)
      setProcessedStats(entry.stats)
    }
    setJumpSignal(s => s + 1)
  }

  return (
    <div className="app">
      <MenuBar
        onOpenImage={handleOpenImage}
        onSaveImage={handleSaveImage}
      />

      <div className="main" style={{ gridTemplateColumns: `${leftW}px 5px 1fr 5px ${rightW}px` }}>
        <MethodsSidebar
          openCategories={openCategories}
          onToggleCategory={toggleCategory}
          activeMethod={activeMethod}
          onSelectMethod={selectMethod}
        />

        <div
          className="resizer"
          onPointerDown={onResizeDown('left')}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          onPointerCancel={onResizeUp}
        />

        <CanvasArea
          imgSrc={imgSrc}
          processedSrc={previewSrc ?? processedSrc}
          zoom={zoom}
          onZoomChange={setZoom}
          compareMode={compareMode}
          onCompareChange={setCompareMode}
          tool={tool}
          onToolChange={setTool}
          imgDimensions={imgDimensions}
          onOpenImage={handleOpenImage}
          jumpKey={jumpSignal}
        />

        <div
          className="resizer"
          onPointerDown={onResizeDown('right')}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
          onPointerCancel={onResizeUp}
        />

        <div className="right-col">
          <div className="tabs-strip">
            <div
              className={'t' + (scopeView !== 'history' ? ' active' : '')}
              onClick={() => setScopeView('histogram')}
            >
              <Icon name="settings" size={12} /> Control
            </div>
            <div
              className={'t' + (scopeView === 'history' ? ' active' : '')}
              onClick={() => setScopeView('history')}
            >
              <Icon name="info" size={12} /> History
            </div>
          </div>

          <ScopePanel
            view={scopeView}
            onViewChange={setScopeView}
            dftFilter={dftFilter}
            history={history}
            currentHistoryIdx={currentHistoryIdx}
            onJump={handleJump}
            histogram={processedHistogram ?? imgHistogram}
            imgDimensions={imgDimensions}
          />

          <ControlsPanel
            activeMethod={activeMethod}
            onApply={handleApply}
            onPreview={handlePreview}
            applying={applying}
            hasImage={!!imgSrc}
            pyodideStatus={pyodide.status}
            pyodideError={pyodide.error}
            applyError={applyError}
          />
        </div>
      </div>

      <StatusBar
        imgName={imgName}
        imgDimensions={imgDimensions}
        imgStats={processedStats ?? imgStats}
      />
    </div>
  )
}
