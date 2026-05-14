import '../styles/TitleBar.css'
import Icon from './icons.jsx'

export default function TitleBar({ docName, dirty, collaborators }) {
  return (
    <div className="titlebar">
      <div className="traffic">
        <span className="r" /><span className="y" /><span className="g" />
      </div>
      <div className="title-doc">
        <span className="mark"><Icon name="logo" size={16} /></span>
        <span className="doc-name">{docName}</span>
        <span className="doc-state">{dirty ? 'EDITED' : 'SAVED'}</span>
      </div>
      <div className="title-right">
        {collaborators.map((c, i) => (
          <span key={i} className="avatar" style={{ background: c.color }} title={c.name}>{c.initials}</span>
        ))}
        <button className="btn-share" style={{
          height: 22, padding: '0 10px', marginLeft: 6,
          background: 'var(--bg-4)', border: '1px solid var(--border-2)', borderRadius: 3,
          color: 'var(--fg-0)', font: '500 11px var(--font-sans)', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Icon name="share" size={11} /> Share
        </button>
      </div>
    </div>
  )
}
