import '../styles/ScopePanel.css'

function HistogramSVG({ histogram }) {
  const W = 512, H = 120

  if (!histogram) {
    return (
      <svg className="scope-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <g stroke="#1c1d21" strokeWidth="1">
          <line x1="0" y1="30"  x2={W} y2="30" />
          <line x1="0" y1="60"  x2={W} y2="60" />
          <line x1="0" y1="90"  x2={W} y2="90" />
        </g>
      </svg>
    )
  }

  const bw = W / 256
  const bars = []
  for (let i = 0; i < 256; i++) {
    const barH = Math.max(1, histogram[i] * (H - 2))
    bars.push(<rect key={i} x={i * bw} y={H - barH} width={Math.max(1, bw - 0.3)} height={barH} />)
  }

  // Smooth envelope curve sampled every 2 bins
  const pts = []
  for (let i = 0; i < 256; i += 2) {
    pts.push([(i + 1) * bw, H - histogram[i] * (H - 2)])
  }
  let path = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i], [px, py] = pts[i - 1]
    path += ` Q${px},${py} ${(px + x) / 2},${(py + y) / 2}`
  }
  path += ` T${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`

  return (
    <svg className="scope-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <g stroke="#1c1d21" strokeWidth="1">
        <line x1="0" y1="30"  x2={W} y2="30" />
        <line x1="0" y1="60"  x2={W} y2="60" />
        <line x1="0" y1="90"  x2={W} y2="90" />
      </g>
      <g stroke="#16171a" strokeWidth="1">
        <line x1={W / 3}     y1="0" x2={W / 3}     y2={H} />
        <line x1={(W * 2)/3} y1="0" x2={(W * 2)/3} y2={H} />
      </g>
      <g fill="#C9CBD1">{bars}</g>
      <path d={path} fill="none" stroke="#FF7A1A" strokeWidth="1.6" opacity="0.9" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function DFTView({ filter }) {
  return (
    <div className="dft-view">
      <svg viewBox="0 0 300 120" preserveAspectRatio="none" width="100%" height="100%">
        <defs>
          <radialGradient id="dftgrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0"    stopColor="#f5f6f7" stopOpacity="0.95"/>
            <stop offset="0.06" stopColor="#c9cbd1" stopOpacity="0.85"/>
            <stop offset="0.2"  stopColor="#5c5f68" stopOpacity="0.45"/>
            <stop offset="0.5"  stopColor="#24262b" stopOpacity="0.4"/>
            <stop offset="1"    stopColor="#0a0a0c" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lpmask" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0"    stopColor="#FF7A1A" stopOpacity="0.0"/>
            <stop offset="0.18" stopColor="#FF7A1A" stopOpacity="0.0"/>
            <stop offset="0.22" stopColor="#FF7A1A" stopOpacity="0.7"/>
            <stop offset="1"    stopColor="#0a0a0c" stopOpacity="0.85"/>
          </radialGradient>
          <radialGradient id="hpmask" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0"    stopColor="#0a0a0c" stopOpacity="0.9"/>
            <stop offset="0.15" stopColor="#0a0a0c" stopOpacity="0.8"/>
            <stop offset="0.2"  stopColor="#FF7A1A" stopOpacity="0.7"/>
            <stop offset="0.5"  stopColor="#FF7A1A" stopOpacity="0.0"/>
            <stop offset="1"    stopColor="#0a0a0c" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="300" height="120" fill="#0a0a0c"/>
        <ellipse cx="150" cy="60" rx="150" ry="60" fill="url(#dftgrad)"/>
        <rect x="0"   y="58" width="300" height="4" fill="#c9cbd1" opacity="0.45"/>
        <rect x="148" y="0"  width="4"   height="120" fill="#c9cbd1" opacity="0.45"/>
        {filter === 'lp' && (
          <>
            <ellipse cx="150" cy="60" rx="150" ry="60" fill="url(#lpmask)"/>
            <ellipse cx="150" cy="60" rx="30" ry="18" fill="none" stroke="#FF7A1A" strokeWidth="1" strokeDasharray="3 2" opacity="0.9"/>
          </>
        )}
        {filter === 'hp' && (
          <>
            <ellipse cx="150" cy="60" rx="150" ry="60" fill="url(#hpmask)"/>
            <ellipse cx="150" cy="60" rx="22" ry="14" fill="none" stroke="#FF7A1A" strokeWidth="1" strokeDasharray="3 2" opacity="0.9"/>
          </>
        )}
        <line x1="140" y1="60" x2="160" y2="60" stroke="#FF7A1A" strokeWidth="0.6" opacity="0.7"/>
        <line x1="150" y1="50" x2="150" y2="70" stroke="#FF7A1A" strokeWidth="0.6" opacity="0.7"/>
      </svg>
    </div>
  )
}

function HistoryList({ items, currentIdx, onJump }) {
  return (
    <div className="history-list scrollbar">
      {items.map((h, i) => (
        <div
          key={i}
          className={'history-item' + (i === currentIdx ? ' current' : '')}
          onClick={() => onJump(i)}
        >
          <span className="step">{String(i).padStart(2, '0')}</span>
          <span>{h.label}</span>
          <span className="time">{h.time}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScopePanel({ view, onViewChange, dftFilter, history, currentHistoryIdx, onJump, histogram, imgDimensions }) {
  return (
    <div className="scope-panel">
      <div className="scope-head">
        <span className="title">
          {view === 'histogram' && 'Histogram · Luminance'}
          {view === 'dft'       && 'DFT · |F(u,v)|'}
        </span>
        <span className="pill">{imgDimensions ? `${imgDimensions.w} × ${imgDimensions.h}` : '— × —'}</span>
        <span className="pill">8-BIT · GREY</span>
        <div className="seg">
          <button className={view === 'histogram' ? 'active' : ''} onClick={() => onViewChange('histogram')}>HIST</button>
          <button className={view === 'dft'       ? 'active' : ''} onClick={() => onViewChange('dft')}>DFT</button>
        </div>
      </div>

      {view === 'histogram' && (
        <>
          <HistogramSVG histogram={histogram} />
          <div className="scope-axis">
            <span>0</span><span>shadows</span><span>midtones</span><span>highlights</span><span>255</span>
          </div>
        </>
      )}
      {view === 'dft'     && <DFTView filter={dftFilter} />}
      {view === 'history' && <HistoryList items={history} currentIdx={currentHistoryIdx} onJump={onJump} />}
    </div>
  )
}
