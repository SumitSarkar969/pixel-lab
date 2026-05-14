export default function Icon({ name, size = 18, strokeWidth = 1.75, style }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  }
  switch (name) {
    case 'move':
      return <svg {...props}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
    case 'crop':
      return <svg {...props}><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
    case 'marquee':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2"/></svg>
    case 'lasso':
      return <svg {...props}><path d="M7 22c-1.25-.25-2-1.42-2-3 0-2 1.5-3.5 4-3.5"/><path d="M9 15.5c-3.45-2-5-4.5-5-7 0-3.42 3.13-6.5 8-6.5s8 3 8 6.5c0 3-2.5 5.5-7 7"/></svg>
    case 'brush':
      return <svg {...props}><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
    case 'eraser':
      return <svg {...props}><path d="M20 20H7L3 16c-1.5-1.45-1.5-3.55 0-5L12 2"/><line x1="18" y1="13" x2="9" y2="4"/></svg>
    case 'eyedropper':
      return <svg {...props}><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>
    case 'text':
      return <svg {...props}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
    case 'shape':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
    case 'mask':
      return <svg {...props}><circle cx="9" cy="12" r="7"/><circle cx="15" cy="12" r="7"/></svg>
    case 'gradient':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="14" x2="21" y2="14"/></svg>
    case 'clone':
      return <svg {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
    case 'heal':
      return <svg {...props}><path d="M9 7V4h6v3"/><path d="M5 11h14l-2 9H7l-2-9z"/></svg>
    case 'hand':
      return <svg {...props}><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
    case 'zoom':
      return <svg {...props}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'eye':
      return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'eye-off':
      return <svg {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    case 'plus':
      return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'minus':
      return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'trash':
      return <svg {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
    case 'folder':
      return <svg {...props}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    case 'save':
      return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    case 'histogram':
      return <svg {...props}><path d="M3 3v18h18"/><rect x="6" y="14" width="2" height="5"/><rect x="10" y="9" width="2" height="10"/><rect x="14" y="11" width="2" height="8"/><rect x="18" y="6" width="2" height="13"/></svg>
    case 'info':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8.01"/></svg>
    case 'settings':
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
    case 'chev-down':
      return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>
    case 'chev-right':
      return <svg {...props}><polyline points="9 18 15 12 9 6"/></svg>
    case 'share':
      return <svg {...props}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    case 'more':
      return <svg {...props}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
    case 'minimize':
      return <svg {...props}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    case 'maximize':
      return <svg {...props}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    case 'command':
      return <svg {...props}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
    case 'compass':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
    case 'fx':
      return <svg {...props}><path d="M4 5h6v6H4z"/><path d="M14 5h6v6h-6z"/><path d="M4 15h6v6H4z"/><path d="M14 15h6v6h-6z"/></svg>
    case 'wand':
      return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'logo':
      return (
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
          <rect x="0"  y="0"  width="14" height="14" rx="1.5" fill="#3A3D45"/>
          <rect x="18" y="0"  width="14" height="14" rx="1.5" fill="#3A3D45"/>
          <rect x="36" y="0"  width="14" height="14" rx="1.5" fill="#FF7A1A"/>
          <rect x="0"  y="18" width="14" height="14" rx="1.5" fill="#3A3D45"/>
          <rect x="18" y="18" width="14" height="14" rx="1.5" fill="#5C5F68"/>
          <rect x="36" y="18" width="14" height="14" rx="1.5" fill="#3A3D45"/>
          <rect x="0"  y="36" width="14" height="14" rx="1.5" fill="#3A3D45"/>
          <rect x="18" y="36" width="14" height="14" rx="1.5" fill="#3A3D45"/>
          <rect x="36" y="36" width="14" height="14" rx="1.5" fill="#3A3D45"/>
        </svg>
      )
    default:
      return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>
  }
}
