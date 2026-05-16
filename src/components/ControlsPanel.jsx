import { useState, useRef, useEffect } from 'react'
import '../styles/ControlsPanel.css'
import Icon from './icons.jsx'

// ─── primitive: controlled slider row ────────────────────────────────────

function SliderRow({
  label, value, onChange,
  min = -100, max = 100, defaultV = 0,
  accent = false, suffix = '', precision = 0, scale = 'linear',
}) {
  const isLog = scale === 'log' && min > 0 && max > 0
  const toNorm = (v) => isLog
    ? (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))
    : (v - min) / (max - min)
  const fromNorm = (n) => isLog
    ? min * Math.pow(max / min, n)
    : min + n * (max - min)

  const step  = isLog ? 0.001 : (precision >= 2 ? 0.01 : precision === 1 ? 0.1 : 1)
  const norm   = toNorm(value)
  const center = toNorm(defaultV)
  const left   = Math.min(norm, center)
  const right  = Math.max(norm, center)
  const width  = (right - left) * 100
  const fmt = (v) => {
    const s = precision ? v.toFixed(precision) : Math.round(v)
    return (v > 0 ? '+' : '') + s + suffix
  }
  const handle = (e) => {
    let v
    if (isLog) {
      v = fromNorm(parseFloat(e.target.value))
      if (precision) v = parseFloat(v.toFixed(precision))
    } else {
      v = precision ? parseFloat(e.target.value) : parseInt(e.target.value, 10)
    }
    onChange(v)
  }
  return (
    <div className="slider-row">
      <span className="lbl">{label}</span>
      <div className="track-bp">
        <div className="center" />
        <div className={'fill' + (accent && value !== defaultV ? ' accent' : '')}
             style={{ left: left * 100 + '%', width: width + '%' }} />
        <div className={'thumb' + (accent && value !== defaultV ? ' accent' : '')}
             style={{ left: norm * 100 + '%' }} />
        <input
          type="range"
          min={isLog ? 0 : min}
          max={isLog ? 1 : max}
          step={step}
          value={isLog ? norm : value}
          onChange={handle}
        />
      </div>
      <span className={'val' + (value === defaultV ? ' zero' : '')}>{fmt(value)}</span>
    </div>
  )
}

// ─── small UI bits ───────────────────────────────────────────────────────

function SegRadio({ value, onChange, options }) {
  return (
    <div className="seg-radio">
      {options.map(([v, label]) => (
        <button
          key={v}
          className={value === v ? 'active' : ''}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function CheckRow({ checked, onChange, children }) {
  return (
    <div className="check-row" style={{ cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <span className={'check' + (checked ? ' on' : '')}>
        {checked && <Icon name="info" size={10} />}
      </span>
      {children}
    </div>
  )
}

function Kernel({ size = 3, values, normalized = true }) {
  const klass = size === 3 ? 'k3' : size === 5 ? 'k5' : 'k7'
  return (
    <div className={'kernel ' + klass}>
      {values.map((v, i) => {
        const isCenter = i === Math.floor(values.length / 2)
        const isNeg = v < 0
        return (
          <span key={i} className={'c' + (isCenter ? ' center' : '') + (isNeg ? ' neg' : '')}>
            {typeof v === 'number' ? (normalized ? v.toFixed(2) : v) : v}
          </span>
        )
      })}
    </div>
  )
}

// ─── complex sub-controls (controlled) ───────────────────────────────────

function PiecewiseControls({ params, setParam }) {
  const svgRef = useRef(null)
  const dragging = useRef(null)
  const set = (k, v) => {
    const next = { ...params, [k]: v }
    if (k === 'r1' && next.r1 >= next.r2) next.r1 = next.r2 - 1
    if (k === 'r2' && next.r2 <= next.r1) next.r2 = next.r1 + 1
    setParam(null, next)
  }
  const updateFromPointer = (which, e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const xN = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const yN = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    const r = Math.round(xN * 255)
    const s = Math.round((1 - yN) * 255)
    if (which === 'p1') {
      setParam(null, { ...params, r1: Math.min(r, params.r2 - 1), s1: s })
    } else {
      setParam(null, { ...params, r2: Math.max(r, params.r1 + 1), s2: s })
    }
  }
  const onDown = (which) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = which
    updateFromPointer(which, e)
  }
  const onMove = (which) => (e) => {
    if (dragging.current !== which) return
    updateFromPointer(which, e)
  }
  const onUp = (which) => (e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    dragging.current = null
  }
  const xPct = (r) => (r / 255) * 100
  const yPct = (s) => (1 - s / 255) * 100
  const p1x = (params.r1 / 255) * 80
  const p1y = (1 - params.s1 / 255) * 80
  const p2x = (params.r2 / 255) * 80
  const p2y = (1 - params.s2 / 255) * 80
  const dotStyle = (r, s) => ({
    position: 'absolute', left: `${xPct(r)}%`, top: `${yPct(s)}%`,
    width: 12, height: 12, marginLeft: -6, marginTop: -6, borderRadius: '50%',
    background: '#FF7A1A', border: '1.5px solid #0a0a0c', cursor: 'grab',
    touchAction: 'none', boxSizing: 'border-box',
  })
  return (
    <>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Breakpoint 1</span><span className="reset">Reset</span></div>
        <SliderRow label="r₁ (input)"  value={params.r1} onChange={(v) => set('r1', v)} min={0} max={255} defaultV={70}  accent />
        <SliderRow label="s₁ (output)" value={params.s1} onChange={(v) => set('s1', v)} min={0} max={255} defaultV={30}  accent />
      </div>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Breakpoint 2</span></div>
        <SliderRow label="r₂ (input)"  value={params.r2} onChange={(v) => set('r2', v)} min={0} max={255} defaultV={180} accent />
        <SliderRow label="s₂ (output)" value={params.s2} onChange={(v) => set('s2', v)} min={0} max={255} defaultV={220} accent />
      </div>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Curve</span>
          <span style={{ fontSize: 10, color: 'var(--text-2, #6b6f78)' }}>drag points</span></div>
        <div ref={svgRef} style={{ aspectRatio: '1 / 1', width: '100%', background: '#0a0a0c', borderRadius: 2, border: '1px solid var(--border-1)', position: 'relative', userSelect: 'none' }}>
          <svg viewBox="0 0 80 80" preserveAspectRatio="none" width="100%" height="100%" style={{ display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <g stroke="#1c1d21" strokeWidth="0.6">
              <line x1="20" y1="0" x2="20" y2="80"/><line x1="40" y1="0" x2="40" y2="80"/><line x1="60" y1="0" x2="60" y2="80"/>
              <line x1="0" y1="20" x2="80" y2="20"/><line x1="0" y1="40" x2="80" y2="40"/><line x1="0" y1="60" x2="80" y2="60"/>
            </g>
            <line x1="0" y1="80" x2="80" y2="0" stroke="#3F424A" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"/>
            <polyline points={`0,80 ${p1x},${p1y} ${p2x},${p2y} 80,0`} fill="none" stroke="#FF7A1A" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
          </svg>
          <div style={dotStyle(params.r1, params.s1)} onPointerDown={onDown('p1')} onPointerMove={onMove('p1')} onPointerUp={onUp('p1')} onPointerCancel={onUp('p1')} />
          <div style={dotStyle(params.r2, params.s2)} onPointerDown={onDown('p2')} onPointerMove={onMove('p2')} onPointerUp={onUp('p2')} onPointerCancel={onUp('p2')} />
        </div>
      </div>
    </>
  )
}

function GammaControls({ params, setParam }) {
  const N = 64
  const pts = []
  for (let i = 0; i <= N; i++) {
    const r = i / N
    const s = Math.min(1, Math.max(0, params.gain * Math.pow(r, params.gamma)))
    pts.push(`${(r * 80).toFixed(2)},${((1 - s) * 80).toFixed(2)}`)
  }
  return (
    <>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Transform</span><span className="reset">Reset</span></div>
        <SliderRow label="Gamma γ" value={params.gamma} onChange={(v) => setParam('gamma', v)} min={0.1} max={25.0} defaultV={1.0} precision={2} accent scale="log" />
        <SliderRow label="Gain c"  value={params.gain}  onChange={(v) => setParam('gain', v)}  min={0.1} max={2.0}  defaultV={1.0} precision={2} accent />
      </div>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Curve</span><span style={{ fontSize: 10, color: 'var(--text-2, #6b6f78)' }}>s = c · rᵞ</span></div>
        <div style={{ aspectRatio: '1 / 1', width: '100%', background: '#0a0a0c', borderRadius: 2, border: '1px solid var(--border-1)', position: 'relative' }}>
          <svg viewBox="0 0 80 80" preserveAspectRatio="none" width="100%" height="100%" style={{ display: 'block' }}>
            <g stroke="#1c1d21" strokeWidth="0.6">
              <line x1="20" y1="0" x2="20" y2="80"/><line x1="40" y1="0" x2="40" y2="80"/><line x1="60" y1="0" x2="60" y2="80"/>
              <line x1="0" y1="20" x2="80" y2="20"/><line x1="0" y1="40" x2="80" y2="40"/><line x1="0" y1="60" x2="80" y2="60"/>
            </g>
            <line x1="0" y1="80" x2="80" y2="0" stroke="#3F424A" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"/>
            <polyline points={pts.join(' ')} fill="none" stroke="#FF7A1A" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
          </svg>
        </div>
      </div>
    </>
  )
}

function GraySliceControls({ params, setParam }) {
  const set = (k, v) => {
    const next = { ...params, [k]: v }
    if (k === 'a' && next.a >= next.b) next.a = next.b - 1
    if (k === 'b' && next.b <= next.a) next.b = next.a + 1
    setParam(null, next)
  }
  const { a, b, s1, s2, withBg, invert } = params
  const outV = (r) => withBg ? r : (invert ? s1 : s2)
  const inV  = (r) => invert ? (withBg ? r : s2) : s1
  const toX = (r) => (r / 255) * 80
  const toY = (s) => (1 - s / 255) * 80
  const polyPoints = [
    [0,   outV(0)], [a, outV(a)], [a, inV(a)], [b, inV(b)], [b, outV(b)], [255, outV(255)],
  ].map(([r, s]) => `${toX(r).toFixed(2)},${toY(s).toFixed(2)}`).join(' ')
  const formula = withBg
    ? (invert ? 's = s₁ if r ∉ [a,b], else r' : 's = s₁ if r ∈ [a,b], else r')
    : (invert ? 's = s₁ if r ∉ [a,b], else s₂' : 's = s₁ if r ∈ [a,b], else s₂')
  return (
    <>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Band</span><span className="reset">Reset</span></div>
        <SliderRow label="Lower a" value={a} onChange={(v) => set('a', v)} min={0} max={255} defaultV={100} accent />
        <SliderRow label="Upper b" value={b} onChange={(v) => set('b', v)} min={0} max={255} defaultV={170} accent />
      </div>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Mode</span></div>
        <SegRadio
          value={withBg ? 'bg' : 'no'}
          onChange={(v) => setParam('withBg', v === 'bg')}
          options={[['bg', 'With background'], ['no', 'Without']]}
        />
      </div>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Levels</span></div>
        <SliderRow label="In-band s₁"  value={s1} onChange={(v) => setParam('s1', v)} min={0} max={255} defaultV={230} accent />
        <SliderRow label="Out-band s₂" value={s2} onChange={(v) => setParam('s2', v)} min={0} max={255} defaultV={20} />
        <CheckRow checked={invert} onChange={(v) => setParam('invert', v)}>Invert band</CheckRow>
      </div>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Curve</span>
          <span style={{ fontSize: 10, color: 'var(--text-2, #6b6f78)' }}>{formula}</span></div>
        <div style={{ aspectRatio: '1 / 1', width: '100%', background: '#0a0a0c', borderRadius: 2, border: '1px solid var(--border-1)', position: 'relative' }}>
          <svg viewBox="0 0 80 80" preserveAspectRatio="none" width="100%" height="100%" style={{ display: 'block' }}>
            <g stroke="#1c1d21" strokeWidth="0.6">
              <line x1="20" y1="0" x2="20" y2="80"/><line x1="40" y1="0" x2="40" y2="80"/><line x1="60" y1="0" x2="60" y2="80"/>
              <line x1="0" y1="20" x2="80" y2="20"/><line x1="0" y1="40" x2="80" y2="40"/><line x1="0" y1="60" x2="80" y2="60"/>
            </g>
            <line x1="0" y1="80" x2="80" y2="0" stroke="#3F424A" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"/>
            <line x1={toX(a)} y1="0" x2={toX(a)} y2="80" stroke="#3F424A" strokeWidth="0.4" strokeDasharray="1 2" vectorEffect="non-scaling-stroke"/>
            <line x1={toX(b)} y1="0" x2={toX(b)} y2="80" stroke="#3F424A" strokeWidth="0.4" strokeDasharray="1 2" vectorEffect="non-scaling-stroke"/>
            <polyline points={polyPoints} fill="none" stroke="#FF7A1A" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
          </svg>
        </div>
      </div>
    </>
  )
}

function BitPlaneControls({ params, setParam }) {
  const planes = params.planes
  const setPlane = (i, v) => {
    const next = planes.slice()
    next[i] = v
    setParam('planes', next)
  }
  const addPlane = () => {
    if (planes.length >= 8) return
    setParam('planes', [...planes, 0])
  }
  const removePlane = (i) => {
    setParam('planes', planes.filter((_, idx) => idx !== i))
  }
  return (
    <>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Planes</span><span className="reset">Reset</span></div>
        {planes.map((p, idx) => (
          <div key={idx} className="bp-row">
            <SliderRow label={`Plane ${idx + 1}`} value={p} onChange={(v) => setPlane(idx, v)} min={0} max={7} defaultV={0} accent />
            {planes.length > 1 && (
              <button className="btn ghost bp-remove" onClick={() => removePlane(idx)}>
                <Icon name="trash" size={11} />
              </button>
            )}
          </div>
        ))}
        <button
          className="btn default"
          style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
          onClick={addPlane}
          disabled={planes.length >= 8}
        >
          + Add plane
        </button>
      </div>
      {planes.length > 1 && (
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Combine</span></div>
          <SegRadio
            value={params.combine}
            onChange={(v) => setParam('combine', v)}
            options={[['or', 'OR'], ['and', 'AND'], ['sum', 'Sum']]}
          />
        </div>
      )}
    </>
  )
}

// ─── per-method config table ─────────────────────────────────────────────

const METHOD_CONFIGS = {
  'global-eq': {
    title: 'Global histogram equalization',
    desc: 'Redistributes pixel intensities so the cumulative histogram becomes linear across the full [0, 255] range.',
    defaults: { bins: 256, clipLimit: 0, preserveMean: true, roiOnly: false, blend: 100 },
    render: (p, set) => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Parameters</span><span className="reset">Reset</span></div>
          <SliderRow label="Bin count"  value={p.bins}      onChange={(v) => set('bins', v)}      min={32} max={512} defaultV={256} />
          <SliderRow label="Clip limit" value={p.clipLimit} onChange={(v) => set('clipLimit', v)} min={0}  max={40}  defaultV={0}   accent precision={1} />
          <CheckRow checked={p.preserveMean} onChange={(v) => set('preserveMean', v)}>Preserve mean luminance</CheckRow>
          <CheckRow checked={p.roiOnly}      onChange={(v) => set('roiOnly', v)}>Apply within ROI only</CheckRow>
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Output</span></div>
          <SliderRow label="Blend with original" value={p.blend} onChange={(v) => set('blend', v)} min={0} max={100} defaultV={100} suffix="%" />
        </div>
      </>
    ),
  },
  'clahe': {
    title: 'CLAHE',
    desc: 'Contrast-limited adaptive histogram equalization. Divides the image into tiles and equalizes each, clamping the histogram to limit noise amplification.',
    defaults: { tileR: 8, tileC: 8, clipLimit: 4.0, interp: 'bilinear' },
    render: (p, set) => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Tiles</span><span className="reset">Reset</span></div>
          <SliderRow label="Tile rows"  value={p.tileR}     onChange={(v) => set('tileR', v)}     min={2} max={32} defaultV={8} accent />
          <SliderRow label="Tile cols"  value={p.tileC}     onChange={(v) => set('tileC', v)}     min={2} max={32} defaultV={8} accent />
          <SliderRow label="Clip limit" value={p.clipLimit} onChange={(v) => set('clipLimit', v)} min={1} max={40} defaultV={4.0} precision={1} accent />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Interpolation</span></div>
          <SegRadio
            value={p.interp}
            onChange={(v) => set('interp', v)}
            options={[['nearest', 'Nearest'], ['bilinear', 'Bilinear'], ['bicubic', 'Bicubic']]}
          />
        </div>
      </>
    ),
  },
  'match-hist': {
    title: 'Histogram matching',
    desc: 'Reshape the image histogram to match a target distribution. (No reference image picker yet — currently falls back to flat-target equalization.)',
    defaults: {},
    render: () => null,
  },
  'stretch': {
    title: 'Linear stretch',
    desc: 'Rescale intensities so that the [lowPct, highPct] percentile range maps to [0, 255].',
    defaults: { lowPct: 0, highPct: 100 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Percentiles</span><span className="reset">Reset</span></div>
        <SliderRow label="Low %"  value={p.lowPct}  onChange={(v) => set('lowPct', v)}  min={0} max={50}  defaultV={0}   accent suffix="%" />
        <SliderRow label="High %" value={p.highPct} onChange={(v) => set('highPct', v)} min={50} max={100} defaultV={100} accent suffix="%" />
      </div>
    ),
  },
  'negative': {
    title: 'Negative',
    desc: 's = 255 - r.',
    defaults: {},
    render: () => null,
  },
  'log': {
    title: 'Log transform',
    desc: 's = c · log(1 + r)',
    defaults: { c: 45.99 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Transform</span><span className="reset">Reset</span></div>
        <SliderRow label="Constant c" value={p.c} onChange={(v) => set('c', v)} min={1} max={120} defaultV={45.99} precision={2} accent />
      </div>
    ),
  },
  'gamma': {
    title: 'Gamma correction',
    desc: 'Power-law transform: s = c · rᵞ',
    defaults: { gamma: 1.0, gain: 1.0 },
    render: (p, set) => <GammaControls params={p} setParam={set} />,
  },
  'threshold': {
    title: 'Threshold',
    desc: 'Binarize the image. Pixels above T → 255; below → 0. Use Otsu for an automatic threshold.',
    defaults: { method: 'manual', t: 128, invert: false, antiAlias: true },
    render: (p, set) => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Method</span><span className="reset">Reset</span></div>
          <SegRadio
            value={p.method}
            onChange={(v) => set('method', v)}
            options={[['manual', 'Manual'], ['otsu', 'Otsu'], ['adaptive', 'Adaptive']]}
          />
          <div style={{ height: 8 }}/>
          <SliderRow label={p.method === 'adaptive' ? 'Window' : 'Threshold T'} value={p.t} onChange={(v) => set('t', v)} min={0} max={255} defaultV={128} accent />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Output</span></div>
          <CheckRow checked={p.invert}    onChange={(v) => set('invert', v)}>Invert</CheckRow>
          <CheckRow checked={p.antiAlias} onChange={(v) => set('antiAlias', v)}>Anti-alias edge</CheckRow>
        </div>
      </>
    ),
  },
  'bit-plane': {
    title: 'Bit-plane slicing',
    desc: 'Extract or combine bit planes (0 = LSB, 7 = MSB).',
    defaults: { planes: [0], combine: 'or' },
    render: (p, set) => <BitPlaneControls params={p} setParam={set} />,
  },
  'contrast': {
    title: 'Contrast stretching',
    desc: 'Stretch the [lowPct, highPct] percentile range to [0, 255].',
    defaults: { lowPct: 1, highPct: 99 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Percentiles</span><span className="reset">Reset</span></div>
        <SliderRow label="Low %"  value={p.lowPct}  onChange={(v) => set('lowPct', v)}  min={0}  max={50}  defaultV={1}  accent suffix="%" />
        <SliderRow label="High %" value={p.highPct} onChange={(v) => set('highPct', v)} min={50} max={100} defaultV={99} accent suffix="%" />
      </div>
    ),
  },
  'piecewise': {
    title: 'Piecewise linear transform',
    desc: 'Maps intensities through a polyline defined by two breakpoints (r₁, s₁) and (r₂, s₂). Drag the points on the curve or use the sliders.',
    defaults: { r1: 70, s1: 30, r2: 180, s2: 220 },
    render: (p, set) => <PiecewiseControls params={p} setParam={set} />,
  },
  'gray-slice': {
    title: 'Gray-level slicing',
    desc: 'Highlights an intensity band [a, b]. With background: other pixels pass through unchanged. Without: other pixels are pushed to a constant.',
    defaults: { a: 100, b: 170, s1: 230, s2: 20, withBg: true, invert: false },
    render: (p, set) => <GraySliceControls params={p} setParam={set} />,
  },
  'mean': {
    title: 'Mean (box) filter',
    desc: 'Uniform averaging in a (k×k) neighborhood. The simplest low-pass filter.',
    defaults: { k: 3 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
        <SliderRow label="Window size" value={p.k} onChange={(v) => set('k', v)} min={3} max={31} defaultV={3} accent suffix=" px" />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <Kernel size={3} normalized values={[0.11,0.11,0.11, 0.11,0.11,0.11, 0.11,0.11,0.11]} />
        </div>
      </div>
    ),
  },
  'gaussian': {
    title: 'Gaussian blur',
    desc: 'Convolve with a Gaussian kernel G(x,y) = (1/2πσ²) e^(−(x²+y²)/2σ²).',
    defaults: { k: 5, sigma: 1.4, border: 'reflect' },
    render: (p, set) => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
          <SliderRow label="Kernel size" value={p.k}     onChange={(v) => set('k', v)}     min={3}   max={31} defaultV={3}   accent suffix=" px" />
          <SliderRow label="σ (sigma)"   value={p.sigma} onChange={(v) => set('sigma', v)} min={0.1} max={10} defaultV={1.0} precision={2} accent />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Kernel size={5} normalized values={[
              0.04, 0.06, 0.07, 0.06, 0.04,
              0.06, 0.10, 0.12, 0.10, 0.06,
              0.07, 0.12, 0.14, 0.12, 0.07,
              0.06, 0.10, 0.12, 0.10, 0.06,
              0.04, 0.06, 0.07, 0.06, 0.04,
            ]} />
          </div>
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Border</span></div>
          <SegRadio
            value={p.border}
            onChange={(v) => set('border', v)}
            options={[['zero', 'Zero'], ['reflect', 'Reflect'], ['replicate', 'Replicate']]}
          />
        </div>
      </>
    ),
  },
  'median': {
    title: 'Median filter',
    desc: 'Non-linear filter; replaces each pixel with the median of its neighborhood. Strong against salt-and-pepper noise.',
    defaults: { k: 3, shape: 'square' },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
        <SliderRow label="Window size" value={p.k} onChange={(v) => set('k', v)} min={3} max={15} defaultV={3} accent suffix=" px" />
        <div style={{ marginTop: 10 }}>
          <SegRadio
            value={p.shape}
            onChange={(v) => set('shape', v)}
            options={[['square', 'Square kernel'], ['circular', 'Circular kernel']]}
          />
        </div>
      </div>
    ),
  },
  'laplacian': {
    title: 'Laplacian',
    desc: 'Second-derivative edge detector. ∇²f highlights regions of rapid intensity change.',
    defaults: { kernel: '4', gain: 1.0, addBack: false },
    render: (p, set) => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
          <SegRadio
            value={p.kernel}
            onChange={(v) => set('kernel', v)}
            options={[['4', '4-connected'], ['8', '8-connected']]}
          />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Kernel size={3} normalized={false} values={p.kernel === '8'
              ? [-1,-1,-1, -1,8,-1, -1,-1,-1]
              : [0,-1,0, -1,4,-1, 0,-1,0]} />
          </div>
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Post</span></div>
          <SliderRow label="Gain" value={p.gain} onChange={(v) => set('gain', v)} min={0.1} max={5.0} defaultV={1.0} precision={2} accent />
          <CheckRow checked={p.addBack} onChange={(v) => set('addBack', v)}>Add back to original</CheckRow>
        </div>
      </>
    ),
  },
  'sobel': {
    title: 'Sobel · X/Y',
    desc: 'First-derivative gradient operator. Gx and Gy estimate horizontal and vertical edges.',
    defaults: { dir: 'mag' },
    render: (p, set) => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Direction</span><span className="reset">Reset</span></div>
          <SegRadio
            value={p.dir}
            onChange={(v) => set('dir', v)}
            options={[['x', 'Gx'], ['y', 'Gy'], ['mag', '‖G‖'], ['angle', '∠G']]}
          />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Kernels</span></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Kernel size={3} normalized={false} values={[-1,0,1, -2,0,2, -1,0,1]} />
            <Kernel size={3} normalized={false} values={[-1,-2,-1, 0,0,0, 1,2,1]} />
          </div>
        </div>
      </>
    ),
  },
  'unsharp': {
    title: 'Unsharp mask',
    desc: 'Sharpened = original + amount · (original − blurred).',
    defaults: { radius: 1.4, amount: 80, threshold: 4 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Parameters</span><span className="reset">Reset</span></div>
        <SliderRow label="Radius"    value={p.radius}    onChange={(v) => set('radius', v)}    min={0.1} max={10}  defaultV={1.0} precision={2} suffix=" px" accent />
        <SliderRow label="Amount"    value={p.amount}    onChange={(v) => set('amount', v)}    min={0}   max={300} defaultV={100} suffix="%" accent />
        <SliderRow label="Threshold" value={p.threshold} onChange={(v) => set('threshold', v)} min={0}   max={50}  defaultV={0} />
      </div>
    ),
  },
  'ideal-lp': {
    title: 'Ideal low-pass filter',
    desc: 'H(u,v) = 1 if D(u,v) ≤ D₀, else 0. Causes ringing — see DFT view.',
    defaults: { d0: 36 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀" value={p.d0} onChange={(v) => set('d0', v)} min={1} max={256} defaultV={50} accent suffix=" px" />
      </div>
    ),
  },
  'butter-lp': {
    title: 'Butterworth low-pass',
    desc: 'H(u,v) = 1 / (1 + [D(u,v)/D₀]^(2n)). Order n controls roll-off steepness.',
    defaults: { d0: 40, order: 4 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀"      value={p.d0}    onChange={(v) => set('d0', v)}    min={1} max={256} defaultV={50} accent suffix=" px" />
        <SliderRow label="Order n" value={p.order} onChange={(v) => set('order', v)} min={1} max={10}  defaultV={2}  accent />
      </div>
    ),
  },
  'gaussian-lp': {
    title: 'Gaussian low-pass',
    desc: 'H(u,v) = e^(−D²(u,v)/2D₀²). Smooth roll-off, no ringing.',
    defaults: { d0: 42 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀" value={p.d0} onChange={(v) => set('d0', v)} min={1} max={256} defaultV={50} accent suffix=" px" />
      </div>
    ),
  },
  'ideal-hp': {
    title: 'Ideal high-pass',
    desc: 'H = 1 − H_lp. Passes edges and fine detail; suppresses slow-varying regions.',
    defaults: { d0: 24 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀" value={p.d0} onChange={(v) => set('d0', v)} min={1} max={256} defaultV={20} accent suffix=" px" />
      </div>
    ),
  },
  'butter-hp': {
    title: 'Butterworth high-pass',
    desc: 'Smooth high-pass with order n. Add back gain to taste.',
    defaults: { d0: 28, order: 3, boost: 1.2 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀"      value={p.d0}    onChange={(v) => set('d0', v)}    min={1}   max={256} defaultV={50}  accent suffix=" px" />
        <SliderRow label="Order n" value={p.order} onChange={(v) => set('order', v)} min={1}   max={10}  defaultV={2}   accent />
        <SliderRow label="Boost"   value={p.boost} onChange={(v) => set('boost', v)} min={0.5} max={3}   defaultV={1.0} precision={2} />
      </div>
    ),
  },
  'notch': {
    title: 'Notch reject',
    desc: 'Suppresses periodic noise at specific (u₀, v₀) coordinates in the spectrum.',
    defaults: { u0: 42, v0: -18, d0: 8 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Notch center</span><span className="reset">Reset</span></div>
        <SliderRow label="u₀" value={p.u0} onChange={(v) => set('u0', v)} min={-256} max={256} defaultV={0}  accent />
        <SliderRow label="v₀" value={p.v0} onChange={(v) => set('v0', v)} min={-256} max={256} defaultV={0}  accent />
        <SliderRow label="D₀" value={p.d0} onChange={(v) => set('d0', v)} min={1}    max={64}  defaultV={10} accent suffix=" px" />
      </div>
    ),
  },
  'homomorphic': {
    title: 'Homomorphic filtering',
    desc: 'Operates on ln-domain to separate illumination (low freq) from reflectance (high freq).',
    defaults: { gammaL: 0.4, gammaH: 1.8, d0: 30, c: 1.0 },
    render: (p, set) => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Parameters</span><span className="reset">Reset</span></div>
        <SliderRow label="γ_L (low)"  value={p.gammaL} onChange={(v) => set('gammaL', v)} min={0}   max={2}   defaultV={1.0} precision={2} accent />
        <SliderRow label="γ_H (high)" value={p.gammaH} onChange={(v) => set('gammaH', v)} min={0}   max={3}   defaultV={1.0} precision={2} accent />
        <SliderRow label="D₀"         value={p.d0}     onChange={(v) => set('d0', v)}     min={1}   max={256} defaultV={30}  suffix=" px" />
        <SliderRow label="c (slope)"  value={p.c}      onChange={(v) => set('c', v)}      min={0.1} max={5}   defaultV={1.0} precision={2} />
      </div>
    ),
  },
}

const FALLBACK = {
  title: 'Method',
  desc: 'Adjust the parameters to apply this operation.',
  defaults: {},
  render: () => null,
}

// ─── main component ──────────────────────────────────────────────────────

export default function ControlsPanel({
  activeMethod,
  onApply,
  onPreview,
  applying = false,
  hasImage = false,
  pyodideStatus = 'ready',
  pyodideError = null,
  applyError = null,
}) {
  const cfg = METHOD_CONFIGS[activeMethod] || FALLBACK

  const [store, setStore] = useState({})
  const params = store[activeMethod] ?? cfg.defaults

  const [livePreview] = useState(true)
  const onPreviewRef  = useRef(onPreview)
  useEffect(() => { onPreviewRef.current = onPreview }, [onPreview])

  useEffect(() => {
    if (!store[activeMethod]) {
      setStore((s) => ({ ...s, [activeMethod]: cfg.defaults }))
    }
  }, [activeMethod, cfg.defaults, store])

  // Preview when switching methods
  useEffect(() => {
    if (!livePreview) return
    onPreviewRef.current?.(activeMethod, store[activeMethod] ?? cfg.defaults)
  }, [activeMethod])  // eslint-disable-line react-hooks/exhaustive-deps


  const setParam = (key, value) => {
    const current = store[activeMethod] ?? cfg.defaults
    const next = key === null ? value : { ...current, [key]: value }
    setStore((s) => ({ ...s, [activeMethod]: next }))
    if (livePreview) onPreviewRef.current?.(activeMethod, next)
  }

  const reset = () => {
    setStore((s) => ({ ...s, [activeMethod]: cfg.defaults }))
    if (livePreview) onPreviewRef.current?.(activeMethod, cfg.defaults)
  }

  const handleSectionClick = (e) => {
    if (e.target.closest('.reset')) reset()
  }

  const handleApply = () => {
    if (!onApply || applying) return
    onApply(activeMethod, params)
  }

  const disabled = applying || pyodideStatus !== 'ready' || !onApply || !hasImage
  const applyLabel =
    pyodideStatus === 'loading' ? 'Loading Python…' :
    pyodideStatus === 'error'   ? 'Python unavailable' :
    applying                    ? 'Processing…' :
    !hasImage                   ? 'No image open' :
    'Apply'

  return (
    <div className="controls-panel scrollbar" onClick={handleSectionClick}>
      <h3 className="ctrl-title">{cfg.title}</h3>
      <p className="ctrl-desc">{cfg.desc}</p>
      {cfg.render(params, setParam)}
      {(pyodideError || applyError) && (
        <p style={{ color: '#ff6b6b', fontSize: 11, margin: '8px 0 0' }}>
          {pyodideError || applyError}
        </p>
      )}
      <div className="btn-row">
        <button
          className="btn primary"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={handleApply}
          disabled={disabled}
        >
          {applyLabel}
        </button>
<button className="btn ghost" onClick={reset}><Icon name="trash" size={13}/></button>
      </div>
    </div>
  )
}
