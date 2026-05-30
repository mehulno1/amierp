// Shared utilities used by all directions.
// - Photo: real Unsplash URL with monospace-labeled fallback
// - Logo: redrawn-friendly Ami wordmark placeholder (keeping current vibe)
// - InlineLogin: the top-right inline login form pattern
// - tiny icon set (line-stroke)

const Photo = ({ src, label = '', ratio = '16/9', tone = 'dark', children, style = {} }) => {
  const bg = tone === 'light'
    ? 'linear-gradient(135deg, #e8e3d8, #c9c0ad)'
    : 'linear-gradient(135deg, #2a2620 0%, #16130f 60%, #0a0908 100%)';
  return (
    <div className="ph-fallback" style={{
      position: 'relative',
      width: '100%',
      aspectRatio: ratio,
      background: bg,
      overflow: 'hidden',
      ...style,
    }}>
      {src && (
        <img
          src={src}
          alt={label}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      {label && (
        <div style={{
          position: 'absolute', bottom: 10, left: 14,
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
          color: tone === 'light' ? 'rgba(20,15,10,.55)' : 'rgba(255,255,255,.55)',
          letterSpacing: '.12em', textTransform: 'uppercase',
          padding: '2px 8px',
          background: tone === 'light' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)',
          backdropFilter: 'blur(2px)',
        }}>{label}</div>
      )}
      {children}
    </div>
  );
};

// Known-good Unsplash photo IDs for industrial / steel / manufacturing themes.
// (If any fail, the fallback gradient + label still reads as a placeholder.)
// Verified working & topic-relevant industrial photos for iron/steel themes.
const PHOTOS = {
  heroFactory:     'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=2000&q=80&auto=format&fit=crop', // aerial truck depot
  steelPipes:      'https://images.unsplash.com/photo-1543674892-7d64d45df18b?w=1600&q=80&auto=format&fit=crop',     // overhead stacked steel pipes
  welding:         'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&q=80&auto=format&fit=crop',  // grinding sparks
  furnace:         'https://images.pexels.com/photos/2569842/pexels-photo-2569842.jpeg?w=1600',                       // red industrial pipework / refinery
  pipeStack:       'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=1600&q=80&auto=format&fit=crop',  // industrial pipes & machinery
  cylinders:       'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?w=1600',                       // metal worker / steel fabrication
  worker:          'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?w=1600',                       // worker w/ steel
  warehouse:       'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&q=80&auto=format&fit=crop',     // warehouse aisles
  blueprintTable:  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&q=80&auto=format&fit=crop',
  steelMill:       'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=2000&q=80&auto=format&fit=crop',  // grinding sparks
  ironOre:         'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1600&q=80&auto=format&fit=crop',  // aerial port containers — raw material trading
  truckLogistics:  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80&auto=format&fit=crop',  // Scania truck
  oilGas:          'https://images.pexels.com/photos/87236/pexels-photo-87236.jpeg?w=1600',                            // oil rig at sea
  refinery:        'https://images.pexels.com/photos/2569842/pexels-photo-2569842.jpeg?w=1600',                       // red industrial pipework / refinery
  workerHelmet:    'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?w=1600',                       // worker w/ helmet
  steelGrain:      'https://images.unsplash.com/photo-1543674892-7d64d45df18b?w=1600&q=80&auto=format&fit=crop',     // overhead pipes
  control:         'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1600&q=80&auto=format&fit=crop',
};

// Wordmark: keeps the current "AMI" identity, just typeset cleanly.
// Variant controls colorway (on dark vs light).
const Wordmark = ({ variant = 'dark', sub = 'GROUP', size = 28 }) => {
  const fg = variant === 'dark' ? '#f5f1ea' : '#15110b';
  const accent = variant === 'dark' ? '#d97247' : '#c25a30';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, lineHeight: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: 'IBM Plex Serif',
          fontWeight: 700,
          fontSize: size,
          letterSpacing: '-0.02em',
          color: fg,
        }}>AMI</span>
        <span style={{
          fontFamily: 'IBM Plex Mono',
          fontWeight: 500,
          fontSize: size * 0.42,
          letterSpacing: '.18em',
          color: accent,
          textTransform: 'uppercase',
        }}>{sub}</span>
      </div>
    </div>
  );
};

// Inline login (top-right of nav). Accepts theme tokens.
const InlineLogin = ({ theme = {} }) => {
  const {
    bg = 'rgba(255,255,255,.06)',
    border = 'rgba(255,255,255,.18)',
    text = '#f5f1ea',
    placeholder = 'rgba(245,241,234,.5)',
    btnBg = '#d97247',
    btnFg = '#15110b',
    mute = 'rgba(245,241,234,.55)',
  } = theme;
  const inputBase = {
    background: bg,
    border: `1px solid ${border}`,
    color: text,
    padding: '8px 10px',
    fontSize: 12,
    fontFamily: 'IBM Plex Sans',
    fontWeight: 400,
    width: 130,
    outline: 'none',
    letterSpacing: '0.01em',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: 'IBM Plex Mono', fontSize: 10,
        color: mute, letterSpacing: '.18em', textTransform: 'uppercase',
      }}>
        <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#5fb56f' }}></span>
        ERP
      </div>
      <input placeholder="user@ami" style={inputBase} defaultValue="" />
      <input placeholder="password" type="password" style={inputBase} defaultValue="" />
      <button style={{
        background: btnBg, color: btnFg,
        border: 'none', padding: '9px 16px',
        fontFamily: 'IBM Plex Sans', fontWeight: 600,
        fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase',
        cursor: 'pointer',
      }}>Sign in →</button>
      <style>{`
        input::placeholder{ color: ${placeholder}; }
      `}</style>
    </div>
  );
};

// Subtle marquee of certifications/customer logos done as text
const LogoStrip = ({ items, color = 'rgba(245,241,234,.55)', size = 14 }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 32, flexWrap: 'wrap',
  }}>
    {items.map((it, i) => (
      <div key={i} style={{
        fontFamily: 'IBM Plex Serif',
        fontWeight: 500,
        fontSize: size,
        color: color,
        letterSpacing: '.04em',
        fontStyle: it.italic ? 'italic' : 'normal',
      }}>{it.name}</div>
    ))}
  </div>
);

// Stat block — number with mono label
const Stat = ({ value, suffix = '', label, color = '#15110b', accent = '#c25a30' }) => (
  <div>
    <div style={{
      fontFamily: 'IBM Plex Serif',
      fontWeight: 300,
      fontSize: 72,
      lineHeight: 0.95,
      letterSpacing: '-0.04em',
      color: color,
    }}>
      {value}<span style={{ color: accent, fontSize: 42, marginLeft: 2 }}>{suffix}</span>
    </div>
    <div style={{
      fontFamily: 'IBM Plex Mono',
      fontSize: 10,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'rgba(20,15,10,.55)',
      marginTop: 10,
      maxWidth: 200,
      lineHeight: 1.5,
    }}>{label}</div>
  </div>
);

// Hairline rule
const Rule = ({ color = 'rgba(0,0,0,.12)', margin = '0' }) => (
  <div style={{ height: 1, background: color, margin }} />
);

// Icon set — tiny inline stroke icons (simple shapes only)
const Icon = ({ name, size = 18, color = 'currentColor' }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'arrow':     return <svg {...common}><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg>;
    case 'arrow-ne':  return <svg {...common}><line x1="6" y1="18" x2="18" y2="6"/><polyline points="9 6 18 6 18 15"/></svg>;
    case 'plus':      return <svg {...common}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'minus':     return <svg {...common}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'search':    return <svg {...common}><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>;
    case 'bell':      return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><line x1="10.5" y1="21" x2="13.5" y2="21"/></svg>;
    case 'check':     return <svg {...common}><polyline points="5 13 10 18 20 6"/></svg>;
    case 'menu':      return <svg {...common}><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>;
    case 'box':       return <svg {...common}><rect x="4" y="6" width="16" height="14" rx="1"/><line x1="4" y1="11" x2="20" y2="11"/></svg>;
    case 'chart':     return <svg {...common}><polyline points="4 18 10 12 14 16 20 8"/><line x1="4" y1="20" x2="20" y2="20"/></svg>;
    case 'users':     return <svg {...common}><circle cx="9" cy="9" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/></svg>;
    case 'doc':       return <svg {...common}><path d="M7 3h7l5 5v13H7z"/><polyline points="14 3 14 9 19 9"/></svg>;
    case 'cart':      return <svg {...common}><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l3 12h12l2-8H7"/></svg>;
    case 'wrench':    return <svg {...common}><path d="M14 7a4 4 0 0 1 5 5l-9 9-4-1-1-4 9-9z"/></svg>;
    case 'settings':  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>;
    case 'eye':       return <svg {...common}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'filter':    return <svg {...common}><polygon points="4 5 20 5 14 13 14 19 10 21 10 13 4 5"/></svg>;
    case 'download':  return <svg {...common}><path d="M12 4v12"/><polyline points="6 12 12 18 18 12"/><line x1="4" y1="21" x2="20" y2="21"/></svg>;
    default: return null;
  }
};

// Subtle technical grid overlay
const TechGrid = ({ color = 'rgba(255,255,255,0.04)', size = 40, opacity = 1 }) => (
  <div style={{
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity,
    pointerEvents: 'none',
  }} />
);

Object.assign(window, {
  Photo, PHOTOS, Wordmark, InlineLogin, LogoStrip, Stat, Rule, Icon, TechGrid,
});
