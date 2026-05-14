import { useState, useContext, useRef, createContext } from 'react'
import '../styles/ControlsPanel.css'
import Icon from './icons.jsx'

const ResetCtx = createContext(0)

function SliderRow({ label, value: initialValue, min = -100, max = 100, defaultV = 0, accent = false, suffix = '', precision = 0 }) {
  const resetKey = useContext(ResetCtx)
  const [value, setValue] = useState(initialValue)
  const lastResetKey = useRef(resetKey)

  if (lastResetKey.current !== resetKey) {
    lastResetKey.current = resetKey
    setValue(defaultV)
  }

  const step = precision >= 2 ? 0.01 : precision === 1 ? 0.1 : 1
  const range = max - min
  const norm   = (value - min) / range
  const center = (defaultV - min) / range
  const left   = Math.min(norm, center)
  const right  = Math.max(norm, center)
  const width  = (right - left) * 100
  const fmt = (v) => {
    const s = precision ? v.toFixed(precision) : Math.round(v)
    return (v > 0 ? '+' : '') + s + suffix
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
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => setValue(precision ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
        />
      </div>
      <span className={'val' + (value === defaultV ? ' zero' : '')}>{fmt(value)}</span>
    </div>
  )
}

function BitPlaneControls() {
  const resetKey = useContext(ResetCtx)
  const lastResetKey = useRef(resetKey)
  const [planeIds, setPlaneIds] = useState([0])
  const counter = useRef(1)

  if (lastResetKey.current !== resetKey) {
    lastResetKey.current = resetKey
    setPlaneIds([0])
    counter.current = 1
  }

  const addPlane = () => {
    if (planeIds.length >= 8) return
    setPlaneIds(prev => [...prev, counter.current++])
  }

  const removePlane = (id) => setPlaneIds(prev => prev.filter(x => x !== id))

  return (
    <>
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Planes</span><span className="reset">Reset</span></div>
        {planeIds.map((id, idx) => (
          <div key={id} className="bp-row">
            <SliderRow label={`Plane ${idx + 1}`} value={0} min={0} max={7} defaultV={0} accent />
            {planeIds.length > 1 && (
              <button className="btn ghost bp-remove" onClick={() => removePlane(id)}>
                <Icon name="trash" size={11} />
              </button>
            )}
          </div>
        ))}
        <button
          className="btn default"
          style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
          onClick={addPlane}
          disabled={planeIds.length >= 8}
        >
          + Add plane
        </button>
      </div>
      {planeIds.length > 1 && (
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Combine</span></div>
          <div className="seg-radio">
            <button className="active">OR</button>
            <button>AND</button>
            <button>Sum</button>
          </div>
        </div>
      )}
    </>
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

const METHOD_CONFIGS = {
  'global-eq': {
    title: 'Global histogram equalization',
    desc: 'Redistributes pixel intensities so the cumulative histogram becomes linear across the full [0, 255] range.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Parameters</span><span className="reset">Reset</span></div>
          <SliderRow label="Bin count"  value={256} min={32} max={512} defaultV={256} />
          <SliderRow label="Clip limit" value={3.0} min={0}  max={40}  defaultV={0}   accent precision={1} />
          <div className="check-row" style={{ marginTop: 8 }}>
            <span className="check on"><Icon name="info" size={10}/></span>
            Preserve mean luminance
          </div>
          <div className="check-row">
            <span className="check" />
            Apply within ROI only
          </div>
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Output</span></div>
          <SliderRow label="Blend with original" value={100} min={0} max={100} defaultV={100} suffix="%" />
        </div>
      </>
    ),
  },
  'clahe': {
    title: 'CLAHE',
    desc: 'Contrast-limited adaptive histogram equalization. Divides the image into tiles and equalizes each, clamping the histogram to limit noise amplification.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Tiles</span><span className="reset">Reset</span></div>
          <SliderRow label="Tile rows"  value={8}   min={2} max={32} defaultV={8}   accent />
          <SliderRow label="Tile cols"  value={8}   min={2} max={32} defaultV={8}   accent />
          <SliderRow label="Clip limit" value={4.0} min={1} max={40} defaultV={2.0} precision={1} accent />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Interpolation</span></div>
          <div className="seg-radio">
            <button>Nearest</button>
            <button className="active">Bilinear</button>
            <button>Bicubic</button>
          </div>
        </div>
      </>
    ),
  },
  'gamma': {
    title: 'Gamma correction',
    desc: 'Power-law transform: s = c · rᵞ. Values below 1 brighten midtones; above 1 darken them.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Transform</span><span className="reset">Reset</span></div>
          <SliderRow label="Gamma γ" value={0.55} min={0.1} max={3.0} defaultV={1.0} precision={2} accent />
          <SliderRow label="Gain c"  value={1.0}  min={0.1} max={2.0} defaultV={1.0} precision={2} />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Curve</span></div>
          <div style={{ height: 80, background: '#0a0a0c', borderRadius: 2, border: '1px solid var(--border-1)', position: 'relative' }}>
            <svg viewBox="0 0 80 80" preserveAspectRatio="none" width="100%" height="100%">
              <g stroke="#1c1d21" strokeWidth="0.6">
                <line x1="20" y1="0"  x2="20" y2="80"/>
                <line x1="40" y1="0"  x2="40" y2="80"/>
                <line x1="60" y1="0"  x2="60" y2="80"/>
                <line x1="0"  y1="20" x2="80" y2="20"/>
                <line x1="0"  y1="40" x2="80" y2="40"/>
                <line x1="0"  y1="60" x2="80" y2="60"/>
              </g>
              <line x1="0" y1="80" x2="80" y2="0" stroke="#3F424A" strokeWidth="0.6" strokeDasharray="2 2"/>
              <path d="M0,80 C 10,20 30,5 80,0" fill="none" stroke="#FF7A1A" strokeWidth="1.4"/>
            </svg>
          </div>
        </div>
      </>
    ),
  },
  'bit-plane': {
    title: 'Bit-plane slicing',
    desc: 'Extracts a single bit plane (0 = LSB, 7 = MSB) from the image. Combine multiple planes to reconstruct or inspect contributions.',
    render: () => <BitPlaneControls />,
  },
  'threshold': {
    title: 'Threshold',
    desc: 'Binarize the image. Pixels above T → 255; below → 0. Use Otsu for an automatic threshold.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Method</span><span className="reset">Reset</span></div>
          <div className="seg-radio">
            <button className="active">Manual</button>
            <button>Otsu</button>
            <button>Adaptive</button>
          </div>
          <div style={{ height: 8 }}/>
          <SliderRow label="Threshold T" value={128} min={0} max={255} defaultV={128} accent />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Output</span></div>
          <div className="check-row"><span className="check" />Invert</div>
          <div className="check-row"><span className="check on"><Icon name="info" size={10}/></span>Anti-alias edge</div>
        </div>
      </>
    ),
  },
  'negative': {
    title: 'Negative',
    desc: 'Linear inversion: s = (L − 1) − r.',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Output</span><span className="reset">Reset</span></div>
        <SliderRow label="Blend" value={100} min={0} max={100} defaultV={100} suffix="%" />
        <SliderRow label="Pivot" value={128} min={0} max={255} defaultV={128} />
      </div>
    ),
  },
  'log': {
    title: 'Log transform',
    desc: 'Compresses dynamic range: s = c · log(1 + r). Useful for emphasizing dark regions.',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Transform</span><span className="reset">Reset</span></div>
        <SliderRow label="Constant c" value={45.99} min={1}  max={120} defaultV={45.99} precision={2} accent />
        <SliderRow label="Base"       value={10}    min={2}  max={10}  defaultV={10} />
      </div>
    ),
  },
  'gaussian': {
    title: 'Gaussian blur',
    desc: 'Convolve with a Gaussian kernel G(x,y) = (1/2πσ²) e^(−(x²+y²)/2σ²).',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
          <SliderRow label="Kernel size" value={5}   min={3}   max={31} defaultV={3}   accent suffix=" px" />
          <SliderRow label="σ (sigma)"   value={1.4} min={0.1} max={10} defaultV={1.0} precision={2} accent />
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
          <div className="seg-radio">
            <button>Zero</button>
            <button className="active">Reflect</button>
            <button>Replicate</button>
          </div>
        </div>
      </>
    ),
  },
  'median': {
    title: 'Median filter',
    desc: 'Non-linear filter; replaces each pixel with the median of its neighborhood. Strong against salt-and-pepper noise.',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
        <SliderRow label="Window size" value={5} min={3} max={15} defaultV={3} accent suffix=" px" />
        <div className="check-row" style={{ marginTop: 10 }}><span className="check on"><Icon name="info" size={10}/></span>Square kernel</div>
        <div className="check-row"><span className="check" />Circular kernel</div>
      </div>
    ),
  },
  'mean': {
    title: 'Mean (box) filter',
    desc: 'Uniform averaging in a (k×k) neighborhood. The simplest low-pass filter.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
          <SliderRow label="Window size" value={3} min={3} max={31} defaultV={3} accent suffix=" px" />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Kernel size={3} normalized values={[0.11,0.11,0.11, 0.11,0.11,0.11, 0.11,0.11,0.11]} />
          </div>
        </div>
      </>
    ),
  },
  'laplacian': {
    title: 'Laplacian',
    desc: 'Second-derivative edge detector. ∇²f highlights regions of rapid intensity change.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Kernel</span><span className="reset">Reset</span></div>
          <div className="seg-radio">
            <button className="active">4-connected</button>
            <button>8-connected</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <Kernel size={3} normalized={false} values={[0,-1,0, -1,4,-1, 0,-1,0]} />
          </div>
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Post</span></div>
          <SliderRow label="Gain" value={1.0} min={0.1} max={5.0} defaultV={1.0} precision={2} accent />
          <div className="check-row"><span className="check" />Add back to original</div>
        </div>
      </>
    ),
  },
  'sobel': {
    title: 'Sobel · X/Y',
    desc: 'First-derivative gradient operator. Gx and Gy estimate horizontal and vertical edges.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Direction</span><span className="reset">Reset</span></div>
          <div className="seg-radio">
            <button>Gx</button>
            <button>Gy</button>
            <button className="active">‖G‖</button>
            <button>∠G</button>
          </div>
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
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Parameters</span><span className="reset">Reset</span></div>
        <SliderRow label="Radius"    value={1.4} min={0.1} max={10}  defaultV={1.0}  precision={2} suffix=" px" accent />
        <SliderRow label="Amount"    value={80}  min={0}   max={300} defaultV={100}  suffix="%" accent />
        <SliderRow label="Threshold" value={4}   min={0}   max={50}  defaultV={0} />
      </div>
    ),
  },
  'ideal-lp': {
    title: 'Ideal low-pass filter',
    desc: 'H(u,v) = 1 if D(u,v) ≤ D₀, else 0. Causes ringing — see DFT view.',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀" value={36} min={1} max={256} defaultV={50} accent suffix=" px" />
      </div>
    ),
  },
  'butter-lp': {
    title: 'Butterworth low-pass',
    desc: 'H(u,v) = 1 / (1 + [D(u,v)/D₀]^(2n)). Order n controls roll-off steepness.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
          <SliderRow label="D₀"      value={40} min={1} max={256} defaultV={50} accent suffix=" px" />
          <SliderRow label="Order n" value={4}  min={1} max={10}  defaultV={2}  accent />
        </div>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Magnitude response</span></div>
          <div style={{ height: 60, background: '#0a0a0c', borderRadius: 2, border: '1px solid var(--border-1)' }}>
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" width="100%" height="100%">
              <g stroke="#1c1d21" strokeWidth="0.6">
                <line x1="0"   y1="30" x2="200" y2="30"/>
                <line x1="100" y1="0"  x2="100" y2="60"/>
              </g>
              <path d="M0,4 C40,4 80,8 100,30 C120,52 160,56 200,56" fill="none" stroke="#FF7A1A" strokeWidth="1.4"/>
            </svg>
          </div>
        </div>
      </>
    ),
  },
  'gaussian-lp': {
    title: 'Gaussian low-pass',
    desc: 'H(u,v) = e^(−D²(u,v)/2D₀²). Smooth roll-off, no ringing.',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀" value={42} min={1} max={256} defaultV={50} accent suffix=" px" />
      </div>
    ),
  },
  'ideal-hp': {
    title: 'Ideal high-pass',
    desc: 'H = 1 − H_lp. Passes edges and fine detail; suppresses slow-varying regions.',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
        <SliderRow label="D₀" value={24} min={1} max={256} defaultV={20} accent suffix=" px" />
      </div>
    ),
  },
  'butter-hp': {
    title: 'Butterworth high-pass',
    desc: 'Smooth high-pass with order n. Add back gain to taste.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Cutoff</span><span className="reset">Reset</span></div>
          <SliderRow label="D₀"      value={28}  min={1}   max={256} defaultV={50}  accent suffix=" px" />
          <SliderRow label="Order n" value={3}   min={1}   max={10}  defaultV={2}   accent />
          <SliderRow label="Boost"   value={1.2} min={0.5} max={3}   defaultV={1.0} precision={2} />
        </div>
      </>
    ),
  },
  'notch': {
    title: 'Notch reject',
    desc: 'Suppresses periodic noise at specific (u₀, v₀) coordinates in the spectrum.',
    render: () => (
      <>
        <div className="ctrl-section">
          <div className="ctrl-head"><span>Notch center</span><span className="reset">Reset</span></div>
          <SliderRow label="u₀" value={42}  min={-256} max={256} defaultV={0} accent />
          <SliderRow label="v₀" value={-18} min={-256} max={256} defaultV={0} accent />
          <SliderRow label="D₀" value={8}   min={1}    max={64}  defaultV={10} accent suffix=" px" />
        </div>
      </>
    ),
  },
  'homomorphic': {
    title: 'Homomorphic filtering',
    desc: 'Operates on ln-domain to separate illumination (low freq) from reflectance (high freq).',
    render: () => (
      <div className="ctrl-section">
        <div className="ctrl-head"><span>Parameters</span><span className="reset">Reset</span></div>
        <SliderRow label="γ_L (low)"  value={0.4} min={0} max={2}   defaultV={1.0} precision={2} accent />
        <SliderRow label="γ_H (high)" value={1.8} min={0} max={3}   defaultV={1.0} precision={2} accent />
        <SliderRow label="D₀"         value={30}  min={1} max={256} defaultV={30}  suffix=" px" />
        <SliderRow label="c (slope)"  value={1.0} min={0.1} max={5} defaultV={1.0} precision={2} />
      </div>
    ),
  },
}

const FALLBACK_CONFIG = {
  title: 'Method',
  desc: 'Adjust the parameters to apply this operation.',
  render: () => (
    <div className="ctrl-section">
      <div className="ctrl-head"><span>Parameters</span></div>
      <SliderRow label="Strength" value={50} min={0} max={100} defaultV={50} accent suffix="%" />
    </div>
  ),
}

export default function ControlsPanel({ activeMethod }) {
  const [resetKey, setResetKey] = useState(0)
  const cfg = METHOD_CONFIGS[activeMethod] || FALLBACK_CONFIG

  const handleClick = (e) => {
    if (e.target.closest('.reset')) setResetKey(k => k + 1)
  }

  return (
    <ResetCtx.Provider value={resetKey}>
      <div className="controls-panel scrollbar" onClick={handleClick}>
        <h3 className="ctrl-title">{cfg.title}</h3>
        <p className="ctrl-desc">{cfg.desc}</p>
        {cfg.render()}
        <div className="btn-row">
          <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>Apply</button>
          <button className="btn default">Preview</button>
          <button className="btn ghost"><Icon name="trash" size={13}/></button>
        </div>
      </div>
    </ResetCtx.Provider>
  )
}
