import { useRef, useState, useEffect } from 'react'
import '../styles/CanvasArea.css'
import Icon from './icons.jsx'

const BASE_W = 520
const BASE_H = 390
const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200, 300]

const clampZoom = (z) => Math.max(0.05, Math.min(8, +z.toFixed(2)))

export default function CanvasArea({ imgSrc, zoom, onZoomChange, compareMode, onCompareChange, tool, onToolChange }) {
  const stageRef     = useRef(null)
  const zoomInputRef = useRef(null)
  const splitRef     = useRef(null)
  const splitDragging = useRef(false)

  const [splitPos, setSplitPos] = useState(50)

  const [zoomDropOpen, setZoomDropOpen] = useState(false)
  const [zoomEditing,  setZoomEditing]  = useState(false)
  const [zoomInput,    setZoomInput]    = useState('')

  const [panXY,   setPanXY]   = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const panDragging  = useRef(false)
  const panStartRef  = useRef({ x: 0, y: 0 })
  const panOriginRef = useRef({ x: 0, y: 0 })
  const zoomRef  = useRef(zoom)
  const panXYRef = useRef(panXY)
  useEffect(() => { zoomRef.current = zoom },   [zoom])
  useEffect(() => { panXYRef.current = panXY }, [panXY])

  useEffect(() => {
    if (zoomEditing) zoomInputRef.current?.select()
  }, [zoomEditing])

  useEffect(() => {
    const onMove = (e) => {
      if (panDragging.current) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        setPanXY({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy })
      }
      if (!splitDragging.current || !splitRef.current) return
      const rect = splitRef.current.getBoundingClientRect()
      setSplitPos(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
    }
    const onUp = () => {
      panDragging.current = false
      setPanning(false)
      splitDragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
        onZoomChange(clampZoom(zoomRef.current * factor))
      } else if (e.shiftKey) {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        setPanXY(p => ({ x: p.x - delta, y: p.y }))
      } else {
        setPanXY(p => ({ x: p.x, y: p.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onZoomChange])

  const handleStageMouseDown = (e) => {
    if (tool !== 'hand') return
    e.preventDefault()
    panDragging.current = true
    setPanning(true)
    panStartRef.current  = { x: e.clientX, y: e.clientY }
    panOriginRef.current = { ...panXY }
  }

  const handleFit     = () => {
    if (compareMode === 'side') { onZoomChange(1); setPanXY({ x: 0, y: 0 }); return }
    const s = stageRef.current
    if (!s) return
    onZoomChange(clampZoom(Math.min((s.clientWidth - 60) / BASE_W, (s.clientHeight - 60) / BASE_H)))
    setPanXY({ x: 0, y: 0 })
  }
  const handleFull    = () => { onZoomChange(1); setPanXY({ x: 0, y: 0 }) }
  const handleZoomIn  = () => onZoomChange(clampZoom(zoom * 1.25))
  const handleZoomOut = () => onZoomChange(clampZoom(zoom / 1.25))

  const startEdit = (e) => {
    e.stopPropagation()
    setZoomInput(String(Math.round(zoom * 100)))
    setZoomDropOpen(false)
    setZoomEditing(true)
  }
  const commitZoom = () => {
    const n = parseFloat(zoomInput)
    if (!isNaN(n) && n >= 1) onZoomChange(clampZoom(n / 100))
    setZoomEditing(false)
  }
  const handleZoomKey = (e) => {
    if (e.key === 'Enter')  commitZoom()
    if (e.key === 'Escape') setZoomEditing(false)
  }
  const selectPreset = (pct) => { onZoomChange(pct / 100); setZoomDropOpen(false) }

  return (
    <div className="canvas-wrap">
      <div className="canvas-toolbar">
        <span className={'ico' + (tool === 'hand' ? ' active' : '')} onClick={() => onToolChange('hand')} title="Hand (H)"><Icon name="hand" size={16} /></span>
        <span className="sep" />

        {/* Zoom control */}
        {zoomDropOpen && <div className="zoom-overlay" onClick={() => setZoomDropOpen(false)} />}
        <div className="zoom-ctrl">
          <div className="zoom-readout" onClick={() => { setZoomEditing(false); setZoomDropOpen(!zoomDropOpen) }}>
            {zoomEditing ? (
              <input
                ref={zoomInputRef}
                className="zoom-input"
                value={zoomInput}
                onChange={e => setZoomInput(e.target.value)}
                onBlur={commitZoom}
                onKeyDown={handleZoomKey}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="zoom-pct" onClick={startEdit}>{Math.round(zoom * 100)}%</span>
            )}
            <Icon name="chev-down" size={11} />
          </div>
          {zoomDropOpen && (
            <div className="zoom-dropdown">
              {ZOOM_PRESETS.map(pct => (
                <div
                  key={pct}
                  className={'zoom-item' + (Math.round(zoom * 100) === pct ? ' active' : '')}
                  onClick={() => selectPreset(pct)}
                >{pct}%</div>
              ))}
            </div>
          )}
        </div>

        <span className="ico" title="Fit"  onClick={handleFit}><Icon name="maximize" size={14} /></span>
        <span className="ico" title="100%" onClick={handleFull}><Icon name="minimize" size={14} /></span>

        <div className="compare-toggle">
          <button className={compareMode === 'after'  ? 'active' : ''} onClick={() => onCompareChange('after')}>After</button>
          <button className={compareMode === 'split'  ? 'active' : ''} onClick={() => onCompareChange('split')}>Split</button>
          <button className={compareMode === 'side'   ? 'active' : ''} onClick={() => onCompareChange('side')}>Side</button>
          <button className={compareMode === 'before' ? 'active' : ''} onClick={() => onCompareChange('before')}>Before</button>
        </div>
      </div>

      <div
        className="canvas-stage"
        ref={stageRef}
        onMouseDown={handleStageMouseDown}
        style={{ cursor: tool === 'hand' ? (panning ? 'grabbing' : 'grab') : undefined }}
      >
        <div style={{ transform: `translate(${panXY.x}px, ${panXY.y}px) scale(${zoom})`, transformOrigin: 'center center' }}>
          {compareMode === 'side' ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="image-frame">
                <div className="img-wrap" style={{ backgroundImage: `url(${imgSrc})` }} />
                <span className="label">Before</span>
              </div>
              <div className="image-frame">
                <div className="img-wrap" style={{ backgroundImage: `url(${imgSrc})`, filter: 'grayscale(100%) contrast(1.25) brightness(1.04)' }} />
                <span className="label r">After</span>
              </div>
            </div>
          ) : compareMode === 'split' ? (
            <div className="image-frame">
              <div className="split-box" ref={splitRef}>
                <div className="sp-img" style={{ backgroundImage: `url(${imgSrc})`, filter: 'grayscale(100%) contrast(1.0)' }} />
                <div className="sp-img" style={{ backgroundImage: `url(${imgSrc})`, filter: 'grayscale(100%) contrast(1.25) brightness(1.04)', clipPath: `inset(0 0 0 ${splitPos}%)` }} />
                <div
                  className="split-handle"
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); splitDragging.current = true }}
                >
                  <div className="split-knob" />
                </div>
                <span className="label">Before</span>
                <span className="label r">After</span>
              </div>
            </div>
          ) : (
            <div className="image-frame">
              <div className="img-wrap" style={{
                backgroundImage: `url(${imgSrc})`,
                filter: compareMode === 'before'
                  ? 'grayscale(100%) contrast(1.0)'
                  : 'grayscale(100%) contrast(1.25) brightness(1.04)',
              }} />
              <span className="label">{compareMode === 'before' ? 'Before' : 'After'}</span>
            </div>
          )}
        </div>

        <div className="canvas-overlay">
          <button className="b" onClick={handleFit}><Icon name="zoom" size={11} /> Fit</button>
          <button className="b" onClick={handleFull}>100%</button>
          <button className="b" onClick={handleZoomIn}><Icon name="plus" size={11} /></button>
          <button className="b" onClick={handleZoomOut}><Icon name="minus" size={11} /></button>
          <span style={{ width: 1, background: 'var(--border-1)', margin: '0 2px' }} />
          <button className="b"><Icon name="info" size={12} /> Pixel info</button>
        </div>
      </div>
    </div>
  )
}
