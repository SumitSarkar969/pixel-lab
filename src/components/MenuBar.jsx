import '../styles/MenuBar.css'
import { useState, useRef } from 'react'
import Icon from './icons.jsx'

const OTHER_MENUS = ['Edit', 'Image', 'Layer', 'Select', 'Filter', 'View', 'Window', 'Help']

export default function MenuBar({ onOpenImage, onSaveImage }) {
  const [open, setOpen] = useState(null)
  const fileInputRef = useRef(null)

  const close = () => setOpen(null)

  const handleOpen = () => { close(); fileInputRef.current.click() }
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    onOpenImage(URL.createObjectURL(file), file.name)
    e.target.value = ''
  }
  const handleSave = () => { close(); onSaveImage() }
  const handleExit = () => { close(); window.close() }

  return (
    <div className="menubar">
      {open && <div className="menu-overlay" onClick={close} />}

      <div className="menu-wrap">
        <span
          className={'m' + (open === 'File' ? ' active' : '')}
          onClick={() => setOpen(open === 'File' ? null : 'File')}
        >File</span>
        {open === 'File' && (
          <div className="menu-dropdown">
            <div className="item" onClick={handleOpen}>
              <Icon name="folder" size={13} />Open image…
              <span className="shortcut">Ctrl+O</span>
            </div>
            <div className="item" onClick={handleSave}>
              <Icon name="save" size={13} />Save image…
              <span className="shortcut">Ctrl+S</span>
            </div>
            <div className="menu-sep" />
            <div className="item exit" onClick={handleExit}>Exit</div>
          </div>
        )}
      </div>

      {OTHER_MENUS.map((m) => (
        <span key={m} className="m">{m}</span>
      ))}

      <input ref={fileInputRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={handleFileChange} />

    </div>
  )
}
