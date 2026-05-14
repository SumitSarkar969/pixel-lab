import '../styles/StatusBar.css'

export default function StatusBar({ width, height, depth, sampleValue, mean, std, docSize }) {
  const greyHex = '#' + sampleValue.toString(16).padStart(2, '0').repeat(3)
  return (
    <div className="statusbar">
      <span>{width} × {height} px</span>
      <span className="sep" />
      <span>{depth}-BIT · GREY</span>
      <span className="sep" />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="swatch" style={{ background: greyHex }} />
        <span>L {sampleValue}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span>{(sampleValue / 255).toFixed(3)}</span>
      </span>
      <span className="sep" />
      <span>μ {mean}</span>
      <span style={{ color: 'var(--fg-3)' }}>·</span>
      <span>σ {std}</span>
      <span style={{ flex: 1 }} />
      <span>Doc {docSize}</span>
      <span className="sep" />
      <span style={{ color: 'var(--success)' }}>● GPU</span>
    </div>
  )
}
