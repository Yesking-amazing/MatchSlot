// App.jsx — root: routes screens inside iOS frame, owns global state.

function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const theme = getTheme(t.dark);
  const variant = t.variant; // 'classic' | 'stadium'
  const dark = t.dark;

  // Sample data lives in state so user can create / delete matches.
  const [matches, setMatches] = React.useState(SAMPLE_MATCHES);
  const [tab, setTab] = React.useState('home');
  const [route, setRoute] = React.useState({ name:'home' });
  const [showCreate, setShowCreate] = React.useState(false);
  const [successData, setSuccessData] = React.useState(null);
  const [toastObj, showToast] = useToast();
  const toast = (msg, icon) => showToast(msg, { icon });

  const navigate = (screen, params = {}) => {
    if (screen === 'home') { setTab('home'); setRoute({ name:'home', ...params }); }
    else if (screen === 'manage') { setTab('manage'); setRoute({ name:'manage', ...params }); }
    else if (screen === 'profile') { setTab('profile'); setRoute({ name:'profile' }); }
  };

  const onCreate = (data) => {
    const newMatch = {
      id: `m${Date.now()}`,
      host_club: 'Riverside Rovers FC', host_name: 'Coach Daniels',
      ...data,
      status: 'PENDING_APPROVAL',
      created_at: new Date().toISOString().slice(0,10),
      share_token: `rvr-${data.format}-${Math.random().toString(36).slice(2,5)}`,
      slots: data.slots.map(s => ({...s, status:'PENDING_APPROVAL'})),
      approver: data.approver_email,
    };
    setMatches([newMatch, ...matches]);
    setShowCreate(false);
    setSuccessData(newMatch);
  };

  return (
    <div style={{
      minHeight:'100vh', background:'#11141a',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px 0',
    }}>
      <style>{`
        @keyframes ms-spin { to { transform: rotate(360deg); } }
        @keyframes ms-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes ms-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes ms-sheet-in { from { transform: translateY(100%); } to { transform: none; } }
        @keyframes ms-expand { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 800px; } }
        @keyframes ms-success-burst {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes ms-success-ring {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes ms-slide-up { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: none; } }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <IOSDevice dark={dark} width={402} height={874}>
        <div style={{ height:'100%', position:'relative', overflow:'hidden', background: theme.bg }}>
          {/* Push content below status bar — no top nav */}
          <div style={{ height:'100%', paddingTop: 54, overflow:'auto', position:'relative' }}>
            {tab === 'home' && (
              <HomeScreen
                t={theme} variant={variant} dark={dark} density={t.density}
                matches={matches}
                onNavigate={navigate}
                onCreate={() => setShowCreate(true)}/>
            )}
            {tab === 'manage' && (
              <ManageScreen
                t={theme} variant={variant} dark={dark}
                matches={matches} setMatches={setMatches}
                onCreate={() => setShowCreate(true)}
                toast={toast}
                focusMatch={route.focusMatch}
                focusSlot={route.focusSlot}/>
            )}
            {tab === 'profile' && (
              <ProfilePlaceholder t={theme} variant={variant} dark={dark}/>
            )}
          </div>

          {/* CREATE — full-page overlay */}
          {showCreate && (
            <div style={{
              position:'absolute', inset:0, background: theme.bg,
              animation:'ms-slide-up 320ms cubic-bezier(.2,.7,.2,1)', zIndex: 40,
            }}>
              <div style={{ paddingTop: 54, height:'100%', overflow:'auto' }}>
                <CreateScreen t={theme} variant={variant} dark={dark}
                  onClose={() => setShowCreate(false)}
                  onCreate={onCreate} toast={toast}/>
              </div>
            </div>
          )}

          {/* SUCCESS modal */}
          {successData && (
            <SuccessOverlay t={theme} variant={variant} dark={dark}
              match={successData}
              onShare={() => { setSuccessData(null); navigate('manage'); }}
              onDone={() => { setSuccessData(null); navigate('manage'); }}/>
          )}

          {/* TAB BAR */}
          {!showCreate && !successData && (
            <TabBar t={theme} variant={variant} dark={dark}
              tab={tab} onChange={(s) => navigate(s)}/>
          )}

          <Toast toast={toastObj} t={theme}/>
        </div>
      </IOSDevice>

      {/* Tweaks panel — outside the device frame so it's not clipped. */}
      <TweaksPanel title="MatchSlot tweaks">
        <TweakSection label="Direction"/>
        <TweakRadio label="Variant" value={t.variant}
          options={[{value:'classic', label:'Classic'},{value:'stadium', label:'Stadium'}]}
          onChange={(v)=>setTweak('variant', v)}/>
        <TweakToggle label="Dark mode (floodlit)" value={t.dark}
          onChange={(v)=>setTweak('dark', v)}/>

        <TweakSection label="Layout"/>
        <TweakRadio label="Density" value={t.density}
          options={[{value:'compact', label:'Compact'},{value:'regular', label:'Regular'},{value:'comfy', label:'Comfy'}]}
          onChange={(v)=>setTweak('density', v)}/>

        <TweakSection label="Demo"/>
        <TweakButton label="Reset data" secondary
          onClick={() => setMatches(SAMPLE_MATCHES)}/>
        <TweakButton label="Jump to create offer"
          onClick={() => setShowCreate(true)}/>
      </TweaksPanel>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Tab bar — floating glass, three tabs
// ──────────────────────────────────────────────────────────
function TabBar({ t, variant, dark, tab, onChange }) {
  const tabs = [
    { key:'home', icon:'home', label:'Home' },
    { key:'manage', icon:'matches', label:'Matches' },
    { key:'profile', icon:'profile', label:'Profile' },
  ];
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:0, zIndex:30, paddingBottom: 28,
      pointerEvents:'none',
    }}>
      <div style={{
        margin:'0 18px', borderRadius: variant==='stadium' ? 16 : 24,
        background: dark ? 'rgba(18,42,26,0.85)' : 'rgba(255,255,255,0.85)',
        backdropFilter:'blur(24px) saturate(180%)',
        WebkitBackdropFilter:'blur(24px) saturate(180%)',
        border: `1px solid ${t.cardBorder}`,
        boxShadow: dark
          ? '0 12px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 12px 36px rgba(26,46,26,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
        display:'flex', padding:'8px 6px', pointerEvents:'auto',
      }}>
        {tabs.map((tb) => {
          const active = tb.key === tab;
          return (
            <Press key={tb.key} onClick={() => onChange(tb.key)} scaleTo={0.92}
              style={{ flex:1 }}>
              <div style={{
                padding:'8px 4px', borderRadius: variant==='stadium' ? 10 : 16,
                background: active ? t.secondary : 'transparent',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                transition:'background 200ms',
              }}>
                <MSIcon name={tb.icon} size={22}
                  color={active ? t.primary : t.textTertiary}
                  stroke={active ? 2.4 : 2}/>
                <div style={{
                  fontSize: 10.5, fontWeight: active?700:500,
                  color: active ? t.primary : t.textTertiary,
                  letterSpacing: variant==='stadium' ? 0.5 : 0,
                  fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace' : 'inherit',
                }}>{tb.label}</div>
              </div>
            </Press>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Profile placeholder — kept simple, not in scope
// ──────────────────────────────────────────────────────────
function ProfilePlaceholder({ t, variant, dark }) {
  return (
    <div style={{ background:t.bg, minHeight:'100%', padding:'16px 18px 110px' }}>
      <div style={{ fontSize:30, fontWeight:800, color:t.text, letterSpacing:-0.6,
        marginBottom: 20 }}>Profile</div>

      <Card t={t} variant={variant} style={{
        padding:'22px 16px',
        display:'flex', alignItems:'center', gap:14,
        marginBottom: 16,
      }}>
        <div style={{
          width:64, height:64, borderRadius: variant==='stadium' ? 12 : 22,
          background:t.primary, color: t.dark?'#06140C':'#FFFFFF',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, fontWeight:800,
        }}>CD</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:700, color:t.text }}>Coach Daniels</div>
          <div style={{ fontSize:13, color:t.textSecondary,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            daniels@riversiderovers.club
          </div>
          <div style={{
            marginTop:4, display:'inline-flex', alignItems:'center', gap:5,
            padding:'2px 8px', borderRadius:5, background:t.primaryLight,
            color:t.primary, fontSize:11, fontWeight:700, letterSpacing:0.4,
            fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace' : 'inherit',
          }}>
            <MSIcon name="shield" size={11} color={t.primary}/>
            RIVERSIDE ROVERS FC
          </div>
        </div>
      </Card>

      <div style={{
        padding:'14px 18px', textAlign:'center',
        fontSize:13, color:t.textSecondary, lineHeight:1.5,
      }}>
        Profile is out of scope for this prototype — see the other tabs for the host's core flow.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// SuccessOverlay — celebratory confirmation after creating
// ──────────────────────────────────────────────────────────
function SuccessOverlay({ t, variant, dark, match, onShare, onDone }) {
  const isStadium = variant === 'stadium';
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:50, background: t.bg,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'0 28px',
      animation:'ms-fade-in 300ms',
    }}>
      {/* Burst */}
      <div style={{ position:'relative', marginBottom:24 }}>
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background: t.primary, animation: 'ms-success-ring 1100ms ease-out forwards',
          width: 96, height: 96, left: -8, top: -8,
        }}/>
        <div style={{
          width: 80, height:80, borderRadius:'50%',
          background: t.primary, color:t.dark?'#06140C':'#FFFFFF',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: `0 12px 30px ${t.glow}`,
          animation:'ms-success-burst 520ms cubic-bezier(.2,1.4,.4,1)',
        }}>
          <MSIcon name="sparkle" size={36} color={t.dark?'#06140C':'#FFFFFF'} stroke={2.4}/>
        </div>
      </div>
      <div style={{
        fontSize: 11, fontWeight:700, letterSpacing:1.4, color:t.primary,
        textTransform:'uppercase', marginBottom:8,
        fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace':'inherit',
      }}>Fixture created</div>
      <div style={{
        fontSize:28, fontWeight:800, color:t.text, textAlign:'center',
        letterSpacing:-0.6, marginBottom:8, maxWidth: 280,
      }}>Sent for approval</div>
      <div style={{
        fontSize:14, color:t.textSecondary, textAlign:'center',
        marginBottom: 24, lineHeight:1.45, maxWidth: 300,
      }}>
        We've emailed your approver to review the {match.slots.length} time slot{match.slots.length!==1?'s':''}.
        You'll get a notification once they sign off.
      </div>

      <Card t={t} variant={variant} style={{
        padding:'14px 16px', width:'100%', marginBottom: 26,
        background: isStadium
          ? `linear-gradient(135deg, ${t.scoreboardBg} 0%, ${t.scoreboardSurface} 100%)`
          : t.card,
        color: isStadium ? t.scoreboardText : t.text,
        position:'relative', overflow:'hidden',
      }}>
        {isStadium && <PitchBackdrop t={t} dark={dark} opacity={0.5}/>}
        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
          <FormatBlock t={t} variant={variant} format={match.format} dark={dark}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontSize: 10.5, fontWeight:700,
              color: isStadium ? t.primary : t.textSecondary,
              letterSpacing: 1, textTransform:'uppercase',
              fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace':'inherit',
            }}>{match.age_group} · {match.format}</div>
            <div style={{
              fontSize:16, fontWeight:700, color: isStadium ? '#FFFFFF' : t.text,
              letterSpacing:-0.3, marginTop:2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>{match.location}</div>
            <div style={{
              fontSize:12, color: isStadium ? t.scoreboardMuted : t.textSecondary,
              marginTop:4,
            }}>{match.slots.length} slot{match.slots.length!==1?'s':''} · {match.duration} min</div>
          </div>
        </div>
      </Card>

      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%' }}>
        <MSButton t={t} full title="View in My Matches" icon="arrow-r" onClick={onDone}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Boot
// ──────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
