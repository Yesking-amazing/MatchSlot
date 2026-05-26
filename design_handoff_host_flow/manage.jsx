// ManageScreen — list of match offers with collapsible scoreboard cards
function ManageScreen({ t, variant, dark, matches, setMatches, onCreate, toast, focusMatch, focusSlot }) {
  const [expanded, setExpanded] = React.useState(focusMatch || matches[0]?.id);
  const [filter, setFilter] = React.useState('All');
  const [resultModal, setResultModal] = React.useState(null);
  const [shareModal, setShareModal] = React.useState(null);

  const filters = ['All','Open','Booked','Pending','Closed'];
  const filterFn = (m) => {
    if (filter === 'All') return true;
    if (filter === 'Open') return m.status === 'OPEN';
    if (filter === 'Pending') return m.status === 'PENDING_APPROVAL';
    if (filter === 'Closed') return m.status === 'CLOSED' && !m.awaitingResult;
    if (filter === 'Booked') return m.slots.some(s => s.status === 'BOOKED');
    return true;
  };

  const filtered = matches.filter(filterFn);

  // Focus a slot when arriving — auto-expand its parent match
  React.useEffect(() => {
    if (focusSlot) {
      const parent = matches.find(m => m.slots.some(s => s.id === focusSlot));
      if (parent) setExpanded(parent.id);
    }
  }, [focusSlot, matches]);

  const saveResult = (matchId, slotId, home, away, notes) => {
    setMatches(matches.map(m => m.id === matchId ? {
      ...m, slots: m.slots.map(s => s.id === slotId
        ? {...s, home_score: home, away_score: away, result_notes: notes,
            result_saved_at: new Date().toISOString()} : s),
    } : m));
    setResultModal(null);
    toast('Result saved', 'check');
  };

  const deleteMatch = (matchId) => {
    setMatches(matches.filter(m => m.id !== matchId));
    toast('Match deleted', 'trash');
  };

  return (
    <div style={{ background: t.bg, minHeight:'100%', paddingBottom: 110, position:'relative' }}>
      {/* Header */}
      <div style={{ padding:'14px 18px 6px' }}>
        <div style={{ fontSize:30, fontWeight:800, letterSpacing:-0.6, color: t.text }}>
          {variant === 'stadium' ? 'Fixtures' : 'My matches'}
        </div>
        <div style={{ fontSize:13, color:t.textSecondary, marginTop:2 }}>
          {matches.length} offer{matches.length!==1?'s':''} · {matches.flatMap(m=>m.slots).filter(s=>s.status==='BOOKED').length} confirmed
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding:'10px 14px 10px', display:'flex', gap:6, overflowX:'auto' }}>
        {filters.map(f => {
          const sel = f === filter;
          const count = f==='All' ? matches.length :
                        f==='Open' ? matches.filter(m=>m.status==='OPEN').length :
                        f==='Pending' ? matches.filter(m=>m.status==='PENDING_APPROVAL').length :
                        f==='Closed' ? matches.filter(m=>m.status==='CLOSED' && !m.awaitingResult).length :
                        f==='Booked' ? matches.filter(m=>m.slots.some(s=>s.status==='BOOKED')).length : 0;
          return (
            <Press key={f} onClick={()=>setFilter(f)} scaleTo={0.95}>
              <div style={{
                padding:'7px 14px', borderRadius: variant==='stadium' ? 6 : 999,
                background: sel ? t.primary : t.card,
                color: sel ? (t.dark?'#06140C':'#FFFFFF') : t.text,
                border:`1px solid ${sel?t.primary:t.cardBorder}`,
                fontSize:13, fontWeight: sel?700:500,
                display:'flex', alignItems:'center', gap:6,
                whiteSpace:'nowrap',
                fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace' : 'inherit',
                letterSpacing: variant==='stadium' ? 0.4 : 0,
              }}>
                {f} <span style={{ opacity: 0.6, fontWeight:600 }}>{count}</span>
              </div>
            </Press>
          );
        })}
      </div>

      {/* List */}
      <div style={{ padding:'4px 14px 0', display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.length === 0 ? (
          <EmptyState t={t} icon="trophy" title="No matches yet" hint="Tap + to create your first offer."/>
        ) : filtered.map(m => (
          <MatchCard key={m.id} t={t} variant={variant} dark={dark} match={m}
            expanded={expanded === m.id}
            highlightSlot={focusSlot}
            onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
            onShare={() => setShareModal(m)}
            onDelete={() => deleteMatch(m.id)}
            onSaveResult={(slot) => setResultModal({match: m, slot})}/>
        ))}
      </div>

      {/* FAB */}
      <Press onClick={onCreate} scaleTo={0.92}>
        <div style={{
          position:'absolute', right:18, bottom: 90,
          width:60, height:60, borderRadius: variant==='stadium' ? 16 : 30,
          background: t.primary,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 10px 24px ${t.glow}, 0 2px 8px ${t.glow}`,
          zIndex: 5,
        }}>
          <MSIcon name="plus" size={28} color={t.dark?'#06140C':'#FFFFFF'} stroke={2.6}/>
        </div>
      </Press>

      {resultModal && <ResultModal t={t} variant={variant} dark={dark}
        match={resultModal.match} slot={resultModal.slot}
        onSave={saveResult} onClose={()=>setResultModal(null)}/>}
      {shareModal && <ShareModal t={t} variant={variant} dark={dark}
        match={shareModal} onClose={()=>setShareModal(null)} toast={toast}/>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// MatchCard — collapsible
// ──────────────────────────────────────────────────────────
function MatchCard({ t, variant, dark, match, expanded, onToggle, onShare, onDelete, onSaveResult, highlightSlot }) {
  const isStadium = variant === 'stadium';
  const booked = match.slots.find(s => s.status === 'BOOKED');
  const slotCount = match.slots.length;
  const headerColor = statusColor(t, match.status);

  return (
    <div style={{
      background: t.card,
      borderRadius: isStadium ? 12 : 18,
      border: `1px solid ${t.cardBorder}`,
      boxShadow: `0 4px 14px ${t.shadow}`,
      overflow:'hidden',
      transition:'all 200ms',
    }}>
      {/* SCOREBOARD HEADER */}
      <Press onClick={onToggle} scaleTo={0.99}>
        <div style={{
          position:'relative', overflow:'hidden',
          background: isStadium
            ? `linear-gradient(135deg, ${t.scoreboardBg} 0%, ${t.scoreboardSurface} 100%)`
            : t.card,
          padding: isStadium ? '14px 16px' : '14px 16px',
          color: isStadium ? t.scoreboardText : t.text,
          borderBottom: expanded
            ? `1px solid ${isStadium ? 'rgba(255,255,255,0.06)' : t.divider}`
            : 'transparent',
        }}>
          {isStadium && <PitchBackdrop t={t} dark={dark} opacity={0.5}/>}
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
            {/* Left: Date/format block */}
            {booked ? (
              <DateBlock t={t} variant={variant} iso={booked.start} dark={dark}/>
            ) : (
              <FormatBlock t={t} variant={variant} format={match.format} dark={dark}/>
            )}
            {/* Middle: info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8, marginBottom:4,
              }}>
                <span style={{
                  fontSize:10.5, fontWeight:700,
                  color: isStadium ? t.primary : t.textSecondary,
                  letterSpacing: isStadium ? 1.2 : 0.6,
                  textTransform:'uppercase',
                  fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace':'inherit',
                }}>{match.age_group} · {match.format}</span>
                {isStadium && (
                  <span style={{
                    fontSize:9, color:'rgba(255,255,255,0.4)',
                    fontFamily:'"Space Mono", ui-monospace, monospace', letterSpacing:1, fontWeight:600,
                  }}>#{match.share_token.slice(-4).toUpperCase()}</span>
                )}
              </div>
              <div style={{
                fontSize:17, fontWeight:800, letterSpacing: -0.3,
                color: isStadium ? '#FFFFFF' : t.text,
                lineHeight:1.2, marginBottom:4,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              }}>
                {booked ? `vs ${booked.guest_club}` :
                  match.status === 'PENDING_APPROVAL' ? 'Awaiting approval' :
                  match.status === 'CANCELLED' ? 'Cancelled offer' :
                  `${slotCount} time slot${slotCount!==1?'s':''} open`}
              </div>
              <div style={{
                display:'flex', alignItems:'center', gap:5,
                fontSize:11.5,
                color: isStadium ? t.scoreboardMuted : t.textSecondary,
              }}>
                <MSIcon name="pin" size={11}
                  color={isStadium ? t.scoreboardMuted : t.textSecondary}/>
                <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {match.location}
                </span>
              </div>
            </div>
            {/* Right: status + chevron */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              <StatusPill status={match.status} t={t} variant={variant} dark={dark}/>
              <div style={{
                transform: expanded ? 'rotate(180deg)':'rotate(0deg)',
                transition:'transform 240ms',
              }}>
                <MSIcon name="chevron-d" size={16}
                  color={isStadium ? t.scoreboardMuted : t.textTertiary}/>
              </div>
            </div>
          </div>
        </div>
      </Press>

      {/* EXPANDED BODY */}
      {expanded && (
        <div style={{ animation:'ms-expand 280ms cubic-bezier(.2,.7,.2,1)' }}>
          {/* Slot list */}
          <div style={{ padding:'8px 0' }}>
            {match.slots.map((s, i) => (
              <SlotRow key={s.id} t={t} variant={variant} dark={dark}
                slot={s} match={match} isLast={i === match.slots.length-1}
                highlight={highlightSlot === s.id}
                onSaveResult={() => onSaveResult(s)}/>
            ))}
          </div>
          {/* Action bar */}
          <div style={{
            padding:'12px 16px 14px', display:'flex', gap:8,
            borderTop: `1px solid ${t.divider}`,
            background: variant==='stadium' ? (dark ? '#0a1a10' : '#F2F7EF') : 'transparent',
          }}>
            {match.status === 'OPEN' && (
              <MSButton t={t} title="Share link" icon="share" variant="primary"
                onClick={onShare}
                style={{ height:42, padding:'0 16px', fontSize:13.5, flex:1 }}/>
            )}
            {match.status === 'PENDING_APPROVAL' && (
              <div style={{
                flex:1, display:'flex', alignItems:'center', gap:10,
                padding:'0 14px', height:42,
                borderRadius: variant==='stadium' ? 8 : 14,
                background: `${t.warning}15`,
                border:`1px solid ${t.warning}40`,
              }}>
                <MSIcon name="bell" size={16} color={t.warning}/>
                <span style={{ fontSize:12.5, color:t.text, fontWeight:600 }}>
                  Waiting for {match.approver?.split('@')[0] || 'approver'}
                </span>
              </div>
            )}
            {match.status === 'CLOSED' && match.awaitingResult && (
              <MSButton t={t} title="Save result" icon="trophy" variant="primary"
                onClick={() => onSaveResult(match.slots.find(s => s.played))}
                style={{ height:42, padding:'0 16px', fontSize:13.5, flex:1 }}/>
            )}
            {match.status === 'CLOSED' && !match.awaitingResult && (
              <div style={{
                flex:1, padding:'0 14px', height:42, display:'flex', alignItems:'center', gap:8,
                borderRadius: variant==='stadium' ? 8 : 14,
                background: t.secondary,
              }}>
                <MSIcon name="check" size={16} color={t.success}/>
                <span style={{ fontSize:12.5, color:t.text, fontWeight:600 }}>
                  Match confirmed
                </span>
              </div>
            )}
            <Press onClick={onDelete}>
              <div style={{
                width:42, height:42, borderRadius: variant==='stadium' ? 8 : 14,
                background: `${t.error}10`, border:`1px solid ${t.error}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <MSIcon name="trash" size={16} color={t.error}/>
              </div>
            </Press>
          </div>
        </div>
      )}
    </div>
  );
}

function DateBlock({ t, variant, iso, dark }) {
  const d = new Date(iso);
  const isStadium = variant === 'stadium';
  return (
    <div style={{
      width:58, padding:'6px 0',
      background: isStadium ? 'rgba(0,0,0,0.35)' : t.primaryLight,
      borderRadius: isStadium ? 8 : 14,
      border: isStadium ? `1px solid ${t.primary}40` : 'none',
      textAlign:'center', flexShrink: 0,
    }}>
      <div style={{
        fontSize: isStadium ? 9 : 10,
        fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit',
        color: isStadium ? t.primary : t.primaryDark,
        fontWeight:700, letterSpacing: isStadium ? 1.2 : 0.8,
        textTransform:'uppercase',
      }}>{days[d.getDay()]}</div>
      <div style={{
        fontSize: isStadium ? 22 : 22, fontWeight:800,
        color: isStadium ? '#FFFFFF' : t.primaryDark, lineHeight:1.05, marginTop:2,
        fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit',
      }}>{d.getDate()}</div>
      <div style={{
        fontSize:9.5, fontWeight:700,
        color: isStadium ? t.scoreboardMuted : t.primaryDark,
        textTransform:'uppercase', letterSpacing:0.8, marginTop:2,
        fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit',
      }}>{months[d.getMonth()]} · {fmtTime(iso)}</div>
    </div>
  );
}

function FormatBlock({ t, variant, format, dark }) {
  const isStadium = variant === 'stadium';
  return (
    <div style={{
      width:58, height:58,
      background: isStadium ? 'rgba(0,0,0,0.35)' : t.primaryLight,
      borderRadius: isStadium ? 8 : 14,
      border: isStadium ? `1px solid ${t.primary}40` : 'none',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      flexShrink:0,
    }}>
      <FormationChip format={format} t={t} dark={dark} variant={variant} size="sm"/>
      <div style={{
        fontSize:9.5, fontWeight:700, marginTop:3,
        color: isStadium ? t.primary : t.primaryDark, letterSpacing:0.6,
        fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit',
      }}>{format}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// SlotRow
// ──────────────────────────────────────────────────────────
function SlotRow({ t, variant, dark, slot, match, isLast, highlight, onSaveResult }) {
  const isStadium = variant === 'stadium';
  const c = statusColor(t, slot.status);
  const hasResult = slot.home_score != null;
  return (
    <div style={{
      padding:'10px 16px',
      borderBottom: isLast ? 'none' : `1px solid ${t.divider}`,
      background: highlight ? `${t.primary}10` : 'transparent',
      transition:'background 200ms',
      display:'flex', alignItems:'center', gap:12,
    }}>
      {/* LED dot */}
      <div style={{
        width:8, height:8, borderRadius:'50%', background:c, flexShrink:0,
        boxShadow: isStadium ? `0 0 0 2px ${c}25, 0 0 6px ${c}60` : 'none',
      }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:13.5, fontWeight:700, color:t.text,
          fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit',
        }}>
          {fmtDate(slot.start)} · {fmtTime(slot.start)}
        </div>
        <div style={{ fontSize:11.5, color:t.textSecondary, marginTop:1 }}>
          {slot.status === 'BOOKED' && `${slot.guest_club} · ${slot.guest_contact}`}
          {slot.status === 'HELD' && `Held by ${slot.held_by} — ${15}-min hold`}
          {slot.status === 'OPEN' && `Available · ${match.duration} min`}
          {slot.status === 'REJECTED' && 'Released after sibling booked'}
          {slot.status === 'PENDING_APPROVAL' && 'Awaiting approver decision'}
        </div>
        {hasResult && (
          <div style={{
            marginTop:6, display:'inline-flex', alignItems:'center', gap:6,
            padding:'3px 8px', borderRadius:6,
            background: `${t.success}15`, color: t.success, fontSize:12, fontWeight:700,
            fontFamily:'"Space Mono", ui-monospace, monospace',
          }}>
            <MSIcon name="trophy" size={11} color={t.success}/>
            FT {slot.home_score} — {slot.away_score}
          </div>
        )}
      </div>
      {slot.played && !hasResult && (
        <Press onClick={onSaveResult} scaleTo={0.94}>
          <div style={{
            padding:'6px 12px', borderRadius:8,
            background: t.warning+'22', border:`1px solid ${t.warning}55`,
            color: t.warning, fontSize:12, fontWeight:700,
            display:'flex', alignItems:'center', gap:4,
          }}>
            <MSIcon name="trophy" size={12} color={t.warning}/>
            Save
          </div>
        </Press>
      )}
      {slot.status === 'OPEN' && (
        <span style={{
          fontSize:10.5, fontWeight:700, color:t.success, letterSpacing:0.6,
          textTransform:'uppercase',
          fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit',
        }}>Open</span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Result modal
// ──────────────────────────────────────────────────────────
function ResultModal({ t, variant, dark, match, slot, onSave, onClose }) {
  const [home, setHome] = React.useState(slot.home_score ?? '');
  const [away, setAway] = React.useState(slot.away_score ?? '');
  const [notes, setNotes] = React.useState(slot.result_notes ?? '');
  const isStadium = variant === 'stadium';

  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0, background:'rgba(0,0,0,0.55)',
      zIndex:60, display:'flex', alignItems:'flex-end',
      animation:'ms-fade-in 200ms',
    }}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background:t.bg, width:'100%',
        borderTopLeftRadius: isStadium ? 18 : 28,
        borderTopRightRadius: isStadium ? 18 : 28,
        padding:'14px 18px 24px',
        animation:'ms-sheet-in 320ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width:40, height:4, background:t.cardBorder, borderRadius:2,
          margin:'2px auto 14px' }}/>
        <div style={{ fontSize:11, fontWeight:700, color:t.primary,
          letterSpacing:1, textTransform:'uppercase',
          fontFamily: isStadium ? '"Space Mono", ui-monospace, monospace' : 'inherit' }}>
          Full time
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:t.text, letterSpacing:-0.5,
          marginBottom: 4, marginTop:4 }}>
          {match.host_club.split(' ')[0]} vs {slot.guest_club.split(' ')[0]}
        </div>
        <div style={{ fontSize:13, color:t.textSecondary, marginBottom: 22 }}>
          {match.age_group} · {match.format} · {fmtDate(slot.start)}
        </div>

        {/* Big LED scoreboard */}
        <div style={{
          background: t.scoreboardBg, borderRadius: isStadium ? 12 : 18,
          padding:'22px 18px', marginBottom: 20,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
          position:'relative', overflow:'hidden',
        }}>
          <PitchBackdrop t={t} dark={dark} opacity={0.35}/>
          <ScoreInput t={t} variant={variant} label="HOME" value={home} onChange={setHome}/>
          <div style={{ position:'relative',
            fontFamily:'"Space Mono", ui-monospace, monospace',
            fontSize:32, color:'rgba(255,255,255,0.4)', fontWeight:700 }}>:</div>
          <ScoreInput t={t} variant={variant} label="AWAY" value={away} onChange={setAway}/>
        </div>

        <FieldLabel t={t} variant={variant}>Match notes</FieldLabel>
        <div style={{
          background: t.inputBg, borderRadius: isStadium ? 8 : 14,
          border: `1px solid ${t.cardBorder}`,
          padding:'10px 14px', marginBottom: 18,
        }}>
          <textarea value={notes} onChange={(e)=>setNotes(e.target.value)}
            placeholder="Highlights, observations, weather…"
            style={{
              width:'100%', border:'none', outline:'none', resize:'none',
              minHeight: 60, background:'transparent',
              fontSize:14, color:t.text, fontFamily:'inherit',
            }}/>
        </div>

        <MSButton t={t} full title="Save result" icon="check"
          onClick={() => onSave(match.id, slot.id, Number(home) || 0, Number(away) || 0, notes)}/>
      </div>
    </div>
  );
}

function ScoreInput({ t, variant, label, value, onChange }) {
  const isStadium = variant === 'stadium';
  const inc = () => onChange(String((Number(value)||0)+1));
  const dec = () => onChange(String(Math.max(0, (Number(value)||0)-1)));
  return (
    <div style={{ flex:1, textAlign:'center', position:'relative' }}>
      <div style={{
        fontSize:10, fontWeight:700, letterSpacing:1.4, color:t.primary,
        marginBottom:6, textTransform:'uppercase',
        fontFamily:'"Space Mono", ui-monospace, monospace',
      }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <Press onClick={dec} scaleTo={0.9}>
          <div style={{ width:30, height:30, borderRadius:8,
            background:'rgba(255,255,255,0.08)', display:'flex',
            alignItems:'center', justifyContent:'center' }}>
            <MSIcon name="minus" size={14} color="rgba(255,255,255,0.8)"/>
          </div>
        </Press>
        <div style={{
          fontFamily:'"Space Mono", ui-monospace, monospace',
          fontSize:48, fontWeight:700, color: t.primary,
          textShadow:`0 0 14px ${t.primary}aa`, lineHeight:1, minWidth:50,
        }}>
          {String(value || 0).padStart(1,'0')}
        </div>
        <Press onClick={inc} scaleTo={0.9}>
          <div style={{ width:30, height:30, borderRadius:8,
            background: t.primary, display:'flex',
            alignItems:'center', justifyContent:'center' }}>
            <MSIcon name="plus" size={14} color={t.dark?'#06140C':'#FFFFFF'}/>
          </div>
        </Press>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Share modal
// ──────────────────────────────────────────────────────────
function ShareModal({ t, variant, dark, match, onClose, toast }) {
  const isStadium = variant === 'stadium';
  const link = `matchslot.app/offer/${match.share_token}`;
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    setCopied(true);
    toast('Link copied', 'check');
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0, background:'rgba(0,0,0,0.55)',
      zIndex:60, display:'flex', alignItems:'flex-end',
      animation:'ms-fade-in 200ms',
    }}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background:t.bg, width:'100%',
        borderTopLeftRadius: isStadium ? 18 : 28,
        borderTopRightRadius: isStadium ? 18 : 28,
        padding:'14px 18px 28px',
        animation:'ms-sheet-in 320ms cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width:40, height:4, background:t.cardBorder, borderRadius:2,
          margin:'2px auto 14px' }}/>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          width:56, height:56, borderRadius: 18, background: t.primaryLight,
          margin:'2px auto 14px',
        }}>
          <MSIcon name="share" size={24} color={t.primary}/>
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:t.text, textAlign:'center',
          letterSpacing:-0.4, marginBottom:4 }}>
          Share with guest coaches
        </div>
        <div style={{ fontSize:13.5, color:t.textSecondary, textAlign:'center',
          marginBottom: 18 }}>
          Anyone with this link can pick a slot. The first to book wins.
        </div>

        <div style={{
          background: t.card, borderRadius: isStadium ? 8 : 14,
          border: `1.5px solid ${t.primary}30`,
          padding:'14px 14px',
          display:'flex', alignItems:'center', gap:10, marginBottom: 14,
        }}>
          <MSIcon name="share" size={16} color={t.primary}/>
          <div style={{ flex:1, fontSize:14, color:t.text, fontWeight:600,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            fontFamily:'"Space Mono", ui-monospace, monospace' }}>
            {link}
          </div>
          <Press onClick={onCopy} scaleTo={0.92}>
            <div style={{
              padding:'6px 12px', borderRadius:8,
              background: copied ? t.success : t.primary,
              color: t.dark?'#06140C':'#FFFFFF', fontSize:12.5, fontWeight:700,
              display:'flex', alignItems:'center', gap:5,
            }}>
              <MSIcon name={copied ? 'check' : 'copy'} size={13}
                color={t.dark?'#06140C':'#FFFFFF'}/>
              {copied ? 'Copied' : 'Copy'}
            </div>
          </Press>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <MSButton t={t} title="Share via…" variant="primary" icon="share" full
            onClick={onCopy}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ManageScreen });
