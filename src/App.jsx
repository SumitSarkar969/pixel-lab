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

const HISTORY = [
  { label: 'Open · cameraman.tif',  time: '0s'    },
  { label: 'Global equalization',   time: '+0.2s' },
  { label: 'Gaussian σ=1.4 · 5×5',  time: '+0.4s' },
  { label: 'Threshold · Otsu',      time: '+0.7s' },
]

export default function App() {
  const [tool,        setTool]        = useState('hand')
  const [zoom,        setZoom]        = useState(1)
  const [compareMode, setCompareMode] = useState('after')
  const [scopeView,   setScopeView]   = useState('histogram')

  const [openCategories, setOpenCategories] = useState(['histogram', 'spatial'])
  const [activeMethod,   setActiveMethod]   = useState('gaussian')

  const [currentHistoryIdx, setCurrentHistoryIdx] = useState(2)

  const [imgSrc,  setImgSrc]  = useState(null)
  const [imgName, setImgName] = useState(null)

  const [processedSrc, setProcessedSrc] = useState(null)
  const [applying,     setApplying]     = useState(false)
  const [applyError,   setApplyError]   = useState(null)

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

  useEffect(() => {
    return () => {
      if (processedSrc && processedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(processedSrc)
      }
    }
  }, [processedSrc])

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

  const handleOpenImage = async (url, name) => {
    setImgName(name)
    setProcessedSrc(null)
    setProcessedHistogram(null)
    setApplyError(null)
    try {
      const { url: gray, histogram, w, h, mean, std } = await pyRun(url, 'grayscale', {})
      setImgSrc(gray)
      setImgHistogram(histogram)
      setImgDimensions({ w, h })
      setImgStats({ mean, std })
      setProcessedSrc(null)
      setProcessedStats(null)
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
    if (!pyodide.ready || applying) return
    setApplying(true)
    setApplyError(null)
    try {
      const { url, histogram, mean, std } = await pyodide.run(imgSrc, method, params)
      setProcessedSrc(url)
      setProcessedHistogram(histogram)
      setProcessedStats({ mean, std })
    } catch (err) {
      setApplyError(err.message || String(err))
    } finally {
      setApplying(false)
    }
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
          processedSrc={processedSrc}
          zoom={zoom}
          onZoomChange={setZoom}
          compareMode={compareMode}
          onCompareChange={setCompareMode}
          tool={tool}
          onToolChange={setTool}
          imgDimensions={imgDimensions}
          onOpenImage={handleOpenImage}
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
            history={HISTORY}
            currentHistoryIdx={currentHistoryIdx}
            onJump={setCurrentHistoryIdx}
            histogram={processedHistogram ?? imgHistogram}
            imgDimensions={imgDimensions}
          />

          <ControlsPanel
            activeMethod={activeMethod}
            onApply={handleApply}
            applying={applying}
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
