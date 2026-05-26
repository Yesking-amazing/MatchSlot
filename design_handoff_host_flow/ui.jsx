// Shared UI building blocks for MatchSlot.
// Designed so a single `variant` prop ('classic' | 'stadium') flips the treatment.

// ──────────────────────────────────────────────────────────
// Icons — minimal inline SVGs (no icon library dependency)
// ──────────────────────────────────────────────────────────
const MSIcon = ({ name, size = 20, color = 'currentColor', stroke = 2 }) => {
  const s = size, sw = stroke;
  const common = { width:s, height:s, viewBox:'0 0 24 24', fill:'none',
    stroke:color, strokeWidth:sw, strokeLinecap:'round', strokeLinejoin:'round' };
  switch (name) {
    case 'home': return <svg {...common}><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>;
    case 'matches': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>;
    case 'profile': return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check': return <svg {...common}><path d="M4 12l5 5L20 6"/></svg>;
    case 'x': return <svg {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'chevron-r': return <svg {...common}><path d="M9 5l7 7-7 7"/></svg>;
    case 'chevron-l': return <svg {...common}><path d="M15 19l-7-7 7-7"/></svg>;
    case 'chevron-d': return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'pin': return <svg {...common}><path d="M12 22s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'people': return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2.5-2-4.5-5-4.5"/></svg>;
    case 'share': return <svg {...common}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>;
    case 'copy': return <svg {...common}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>;
    case 'trash': return <svg {...common}><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>;
    case 'ball': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 3l3 4-1 5h-4l-1-5 3-4z"/><path d="M3.5 9.5l4 1M20.5 9.5l-4 1M7 19l1.5-4M17 19l-1.5-4"/></svg>;
    case 'whistle': return <svg {...common}><circle cx="14" cy="13" r="6"/><path d="M14 7V4M2 13l6-2M8 11l1-3"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/></svg>;
    case 'bell': return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'edit': return <svg {...common}><path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3"/></svg>;
    case 'sun': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.5 4.5l1.5 1.5M18 18l1.5 1.5M4.5 19.5L6 18M18 6l1.5-1.5"/></svg>;
    case 'mail': return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>;
    case 'note': return <svg {...common}><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>;
    case 'sparkle': return <svg {...common}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>;
    case 'trophy': return <svg {...common}><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M5 5H3v2a3 3 0 0 0 3 3M19 5h2v2a3 3 0 0 1-3 3M9 14h6v3H9zM8 20h8"/></svg>;
    case 'minus': return <svg {...common}><path d="M5 12h14"/></svg>;
    case 'arrow-r': return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-l': return <svg {...common}><path d="M19 12H5M11 5L4 12l7 7"/></svg>;
    case 'flag': return <svg {...common}><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>;
    default: return null;
  }
};

// ──────────────────────────────────────────────────────────
// AnimatedPress — spring scale on press
// ──────────────────────────────────────────────────────────
const Press = ({ onClick, style, children, disabled, scaleTo = 0.97, ...rest }) => {
  const [down, setDown] = React.useState(false);
  return (
    <div
      role="button"
      onPointerDown={() => !disabled && setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onPointerCancel={() => setDown(false)}
      onClick={(e) => !disabled && onClick && onClick(e)}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        transform: down ? `scale(${scaleTo})` : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 140ms cubic-bezier(.2,.7,.2,1), opacity 120ms',
        userSelect: 'none',
        ...style,
      }}
      {...rest}
    >{children}</div>
  );
};

// ──────────────────────────────────────────────────────────
// Buttons
// ──────────────────────────────────────────────────────────
const MSButton = ({ title, onClick, variant = 'primary', icon, disabled, loading, t, style, full }) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  let bg, color, border, shadow;
  if (isPrimary) { bg = t.primary; color = t.dark ? '#06140C' : '#FFFFFF'; border = 'transparent';
    shadow = `0 6px 18px ${t.glow}, 0 2px 6px ${t.glow}`; }
  else if (isOutline) { bg = 'transparent'; color = t.text; border = `1px solid ${t.cardBorder}`; }
  else if (isGhost) { bg = t.secondary; color = t.primary; border = 'transparent'; }
  else if (isDanger) { bg = 'transparent'; color = t.error; border = `1px solid ${t.error}55`; }
  return (
    <Press onClick={disabled || loading ? undefined : onClick} disabled={disabled || loading} style={{
      width: full ? '100%' : 'auto', display:'inline-flex',
    }}>
      <div style={{
        background: bg, color, border, borderRadius: 14,
        padding: '0 20px', height: 52,
        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        fontSize:16, fontWeight: 600, letterSpacing: 0.2,
        boxShadow: isPrimary ? shadow : 'none',
        width: full ? '100%' : 'auto',
        ...style,
      }}>
        {loading ? <Spinner color={color}/> : <>
          {icon && <MSIcon name={icon} size={18} color={color}/>}
          {title}
        </>}
      </div>
    </Press>
  );
};

const Spinner = ({ color = '#fff', size = 18 }) => (
  <div style={{
    width:size, height:size, borderRadius:'50%',
    border:`2px solid ${color}40`, borderTopColor: color,
    animation: 'ms-spin 0.8s linear infinite',
  }}/>
);

// ──────────────────────────────────────────────────────────
// Status dot/badge
// ──────────────────────────────────────────────────────────
const StatusDot = ({ status, t, glow = false, size = 8 }) => {
  const c = statusColor(t, status);
  return (
    <span style={{
      display:'inline-block', width:size, height:size, borderRadius:'50%',
      background: c, flexShrink: 0,
      boxShadow: glow ? `0 0 0 2px ${c}30, 0 0 8px ${c}80` : 'none',
    }}/>
  );
};

const StatusPill = ({ status, t, dark, variant = 'classic' }) => {
  const c = statusColor(t, status);
  // Stadium: LED-style pill with dot and uppercase mono label
  if (variant === 'stadium') {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'4px 9px 4px 8px', borderRadius:4,
        background: dark ? `${c}20` : `${c}18`,
        border:`1px solid ${c}55`,
        color: c, fontSize:10.5, fontWeight:700,
        fontFamily:'"Space Mono", ui-monospace, monospace', letterSpacing:0.5,
        textTransform:'uppercase',
      }}>
        <StatusDot status={status} t={t} size={6} glow/>
        {statusLabel(status).replace('approval','APPR.')}
      </span>
    );
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 10px', borderRadius:999,
      background: `${c}1A`, color: c,
      fontSize:11.5, fontWeight: 600, letterSpacing:0.2,
    }}>
      <StatusDot status={status} t={t} size={6}/>
      {statusLabel(status)}
    </span>
  );
};

// ──────────────────────────────────────────────────────────
// Formation chip — tiny dot diagram of N v N
// ──────────────────────────────────────────────────────────
const FormationChip = ({ format, t, dark, size = 'sm', variant = 'classic' }) => {
  // Parse "9v9" etc.
  const n = parseInt(format, 10) || 5;
  const w = size === 'sm' ? 48 : 72;
  const h = size === 'sm' ? 28 : 42;
  // Build formation arrangement: GK + lines
  const formations = {
    5: [[1],[2],[2]], 7: [[1],[2],[3],[1]], 9: [[1],[3],[3],[2]], 11: [[1],[4],[4],[2]],
  };
  const form = formations[n] || [[1],[2],[2]];
  const pad = 4;
  const usableW = w - pad*2;
  const usableH = h - pad*2;
  const cols = form.length;
  const dotR = size === 'sm' ? 1.4 : 2;
  const dotColor = variant === 'stadium' ? t.primary : t.primary;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <rect x="0.5" y="0.5" width={w-1} height={h-1} rx={size==='sm'?5:7}
        fill={variant === 'stadium' ? (dark?'#06140C':'#0F2818') : t.secondary}
        stroke={variant === 'stadium' ? `${t.primary}40` : 'transparent'} strokeWidth="0.5"/>
      {/* halfway line */}
      <line x1={w/2} y1={pad} x2={w/2} y2={h-pad}
        stroke={variant==='stadium'?`${t.primary}30`:t.pitchLine} strokeWidth="0.5"/>
      <circle cx={w/2} cy={h/2} r={size==='sm'?2.5:4}
        fill="none" stroke={variant==='stadium'?`${t.primary}30`:t.pitchLine} strokeWidth="0.5"/>
      {/* Home dots — left half */}
      {form.map((rowCount, c) => {
        const x = pad + (usableW/2/cols) * (c + 0.5);
        const dots = rowCount[0];
        return Array.from({length:dots}).map((_, i) => {
          const y = pad + (usableH/(dots+1)) * (i+1);
          return <circle key={`a${c}${i}`} cx={x} cy={y} r={dotR} fill={dotColor}/>;
        });
      })}
      {/* Away dots — right half, mirrored, dimmer */}
      {form.map((rowCount, c) => {
        const x = w - pad - (usableW/2/cols) * (c + 0.5);
        const dots = rowCount[0];
        return Array.from({length:dots}).map((_, i) => {
          const y = pad + (usableH/(dots+1)) * (i+1);
          return <circle key={`b${c}${i}`} cx={x} cy={y} r={dotR}
            fill={variant==='stadium' ? `${t.accent}80` : `${t.primary}55`}/>;
        });
      })}
    </svg>
  );
};

// ──────────────────────────────────────────────────────────
// Pitch backdrop — subtle decorative pitch markings
// ──────────────────────────────────────────────────────────
const PitchBackdrop = ({ t, dark, opacity = 1, style }) => (
  <svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="none"
    style={{ position:'absolute', inset:0, opacity, pointerEvents:'none', ...style }}>
    {/* outline */}
    <rect x="12" y="12" width="376" height="256" rx="4"
      fill="none" stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
    {/* halfway line */}
    <line x1="200" y1="12" x2="200" y2="268"
      stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
    <circle cx="200" cy="140" r="38" fill="none"
      stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
    <circle cx="200" cy="140" r="2" fill={t.scoreboardMuted} fillOpacity="0.3"/>
    {/* boxes */}
    <rect x="12" y="80" width="48" height="120" fill="none"
      stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
    <rect x="340" y="80" width="48" height="120" fill="none"
      stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
    <rect x="12" y="110" width="22" height="60" fill="none"
      stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
    <rect x="366" y="110" width="22" height="60" fill="none"
      stroke={t.scoreboardMuted} strokeOpacity="0.18" strokeWidth="1"/>
  </svg>
);

// ──────────────────────────────────────────────────────────
// Card primitive
// ──────────────────────────────────────────────────────────
const Card = ({ t, variant = 'classic', style, children, onClick, elevated = true }) => {
  const baseRadius = variant === 'stadium' ? 12 : 18;
  const shadow = elevated && !t.dark
    ? `0 1px 0 ${t.divider}, 0 6px 22px ${t.shadow}`
    : elevated && t.dark ? `0 6px 22px ${t.shadow}` : 'none';
  const border = variant === 'stadium' ? `1px solid ${t.cardBorder}` : `1px solid ${t.divider}`;
  const inner = (
    <div style={{
      background: t.card, borderRadius: baseRadius, border,
      boxShadow: shadow, ...style,
    }}>{children}</div>
  );
  if (onClick) return <Press onClick={onClick}>{inner}</Press>;
  return inner;
};

// ──────────────────────────────────────────────────────────
// Section header
// ──────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, onAction, t, variant }) => {
  if (variant === 'stadium') {
    return (
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
        margin:'4px 4px 12px' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.4,
            textTransform:'uppercase', color:t.primary,
            fontFamily:'"Space Mono", ui-monospace, monospace' }}>{title}</div>
          <div style={{ height:2, width:24, background:t.primary, marginTop:4, borderRadius:1 }}/>
        </div>
        {action && (
          <Press onClick={onAction}>
            <span style={{ fontSize:13, color:t.primary, fontWeight:600,
              fontFamily:'"Space Mono", ui-monospace, monospace' }}>{action}</span>
          </Press>
        )}
      </div>
    );
  }
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      margin:'4px 4px 10px' }}>
      <h3 style={{ fontSize:20, fontWeight:800, letterSpacing:-0.4,
        color: t.text, margin:0 }}>{title}</h3>
      {action && (
        <Press onClick={onAction}>
          <span style={{ fontSize:14, color:t.primary, fontWeight:600 }}>{action}</span>
        </Press>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────────────────
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function fmtDate(iso) {
  const d = new Date(iso);
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
function fmtTime(iso) {
  const d = new Date(iso);
  const h = d.getHours(), m = d.getMinutes();
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function fmtTimeRange(iso, durationMin) {
  const d = new Date(iso);
  const end = new Date(d.getTime() + durationMin*60000);
  const f = (x) => `${String(x.getHours()).padStart(2,'0')}:${String(x.getMinutes()).padStart(2,'0')}`;
  return `${f(d)} – ${f(end)}`;
}

// ──────────────────────────────────────────────────────────
// Toast / haptic feedback
// ──────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = React.useState(null);
  const show = React.useCallback((msg, opts = {}) => {
    setToast({ msg, ...opts, id: Date.now() });
    clearTimeout(window.__msToastTo);
    window.__msToastTo = setTimeout(() => setToast(null), opts.duration || 2200);
  }, []);
  return [toast, show];
}

const Toast = ({ toast, t }) => {
  if (!toast) return null;
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:108, display:'flex',
      justifyContent:'center', zIndex:1000, pointerEvents:'none',
      animation: 'ms-toast-in 200ms cubic-bezier(.2,.7,.2,1)',
    }}>
      <div style={{
        background: t.dark ? '#FFFFFFEE' : '#0F2818EE',
        color: t.dark ? '#0F2818' : '#FFFFFF',
        borderRadius: 999, padding:'10px 18px', fontSize:13.5, fontWeight:600,
        boxShadow:'0 8px 30px rgba(0,0,0,0.18)',
        display:'flex', alignItems:'center', gap:8,
        backdropFilter:'blur(20px)',
        maxWidth: 320,
      }}>
        {toast.icon && <MSIcon name={toast.icon} size={16}
          color={t.dark?'#0F2818':'#FFFFFF'}/>}
        {toast.msg}
      </div>
    </div>
  );
};

Object.assign(window, {
  MSIcon, Press, MSButton, Spinner, StatusDot, StatusPill,
  FormationChip, PitchBackdrop, Card, SectionHeader,
  fmtDate, fmtTime, fmtTimeRange, useToast, Toast,
});
