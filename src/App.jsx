import { useState } from 'react'
import Icon from './components/icons.jsx'
import MenuBar from './components/MenuBar.jsx'
import MethodsSidebar from './components/MethodsSidebar.jsx'
import CanvasArea from './components/CanvasArea.jsx'
import ScopePanel from './components/ScopePanel.jsx'
import ControlsPanel from './components/ControlsPanel.jsx'
import StatusBar from './components/StatusBar.jsx'
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

  const [imgSrc,  setImgSrc]  = useState('/assets/sample-cameraman.svg')
  const [imgName, setImgName] = useState('cameraman.tif')

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

  const handleOpenImage = (url, name) => {
    setImgSrc(url)
    setImgName(name)
  }

  const handleSaveImage = () => {
    const a = document.createElement('a')
    a.href = imgSrc
    a.download = imgName
    a.click()
  }

  return (
    <div className="app">
      <MenuBar
        onOpenImage={handleOpenImage}
        onSaveImage={handleSaveImage}
      />

      <div className="main">
        <MethodsSidebar
          openCategories={openCategories}
          onToggleCategory={toggleCategory}
          activeMethod={activeMethod}
          onSelectMethod={selectMethod}
        />

        <CanvasArea
          imgSrc={imgSrc}
          zoom={zoom}
          onZoomChange={setZoom}
          compareMode={compareMode}
          onCompareChange={setCompareMode}
          tool={tool}
          onToolChange={setTool}
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
          />

          <ControlsPanel activeMethod={activeMethod} />
        </div>
      </div>

      <StatusBar
        width="512"
        height="512"
        depth="8"
        sampleValue={142}
        mean={118}
        std={62.4}
        docSize="262 KB"
      />
    </div>
  )
}
