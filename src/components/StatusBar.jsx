import '../styles/StatusBar.css'

function fmtSize(w, h) {
  const bytes = w * h
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return Math.round(bytes / 1024) + ' KB'
}

export default function StatusBar({ imgName, imgDimensions, imgStats }) {
  const hasImage = !!imgDimensions

  return (
    <div className="statusbar">
      <span>{imgName ?? 'No image'}</span>
      <span className="sep" />
      <span>{hasImage ? `${imgDimensions.w} × ${imgDimensions.h} px` : '— × —'}</span>
      <span className="sep" />
      <span>8-BIT · GREY</span>
      <span className="sep" />
      <span>μ {imgStats ? imgStats.mean : '—'}</span>
      <span style={{ color: 'var(--fg-3)' }}>·</span>
      <span>σ {imgStats ? imgStats.std : '—'}</span>
      <span style={{ flex: 1 }} />
      <span>Doc {hasImage ? fmtSize(imgDimensions.w, imgDimensions.h) : '—'}</span>
    </div>
  )
}
