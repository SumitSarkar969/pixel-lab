import '../styles/MethodsSidebar.css'
import Icon from './icons.jsx'

const METHOD_CATEGORIES = [
  {
    id: 'histogram',
    num: '01',
    title: 'Histogram Processing',
    methods: [
      { id: 'global-eq',   name: 'Global equalization',  badge: 'GHE'     },
      { id: 'clahe',       name: 'CLAHE',                badge: 'ADAPT'   },
      { id: 'match-hist',  name: 'Histogram matching',   badge: 'MATCH'   },
      { id: 'stretch',     name: 'Linear stretch',       badge: 'STRETCH' },
    ],
  },
  {
    id: 'point',
    num: '02',
    title: 'Point Processing',
    methods: [
      { id: 'negative',  name: 'Negative',            badge: 'INV'     },
      { id: 'log',       name: 'Log transform',       badge: 'LOG'     },
      { id: 'gamma',     name: 'Gamma correction',    badge: 'γ'       },
      { id: 'threshold', name: 'Threshold',           badge: 'BIN'     },
      { id: 'bit-plane', name: 'Bit-plane slice',     badge: 'BIT'     },
      { id: 'contrast',  name: 'Contrast stretching', badge: 'STRETCH' },
    ],
  },
  {
    id: 'spatial',
    num: '03',
    title: 'Spatial Filtering',
    methods: [
      { id: 'mean',      name: 'Mean (box) filter', badge: 'BLUR'    },
      { id: 'gaussian',  name: 'Gaussian blur',     badge: 'BLUR'    },
      { id: 'median',    name: 'Median filter',     badge: 'DENOISE' },
      { id: 'laplacian', name: 'Laplacian',         badge: 'SHARP'   },
      { id: 'sobel',     name: 'Sobel · X/Y',       badge: 'EDGE'    },
      { id: 'unsharp',   name: 'Unsharp mask',      badge: 'SHARP'   },
    ],
  },
  {
    id: 'frequency',
    num: '04',
    title: 'Frequency Filtering',
    methods: [
      { id: 'ideal-lp',    name: 'Ideal low-pass',         badge: 'LP'    },
      { id: 'butter-lp',   name: 'Butterworth low-pass',   badge: 'LP'    },
      { id: 'gaussian-lp', name: 'Gaussian low-pass',      badge: 'LP'    },
      { id: 'ideal-hp',    name: 'Ideal high-pass',        badge: 'HP'    },
      { id: 'butter-hp',   name: 'Butterworth high-pass',  badge: 'HP'    },
      { id: 'notch',       name: 'Notch reject',           badge: 'NOTCH' },
      { id: 'homomorphic', name: 'Homomorphic',            badge: 'HOMO'  },
    ],
  },
]

export default function MethodsSidebar({ openCategories, onToggleCategory, activeMethod, onSelectMethod }) {
  return (
    <div className="methods scrollbar">
      {METHOD_CATEGORIES.map((cat) => {
        const isOpen = openCategories.includes(cat.id)
        return (
          <div key={cat.id} className={'method-cat' + (isOpen ? ' open' : '')}>
            <div className="method-cat-head" onClick={() => onToggleCategory(cat.id)}>
              <span className="num">{cat.num}</span>
              <span className="title">{cat.title}</span>
              <span className="chev"><Icon name="chev-right" size={12} /></span>
            </div>
            {isOpen && (
              <div className="method-cat-body">
                {cat.methods.map((m) => (
                  <div
                    key={m.id}
                    className={'method-item' + (activeMethod === m.id ? ' active' : '')}
                    onClick={() => onSelectMethod(m.id, cat.id)}
                  >
                    <span>{m.name}</span>
                    <span className="badge">{m.badge}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
