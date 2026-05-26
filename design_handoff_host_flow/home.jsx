// HomeScreen — host's dashboard
function HomeScreen({ t, variant, matches, density, onNavigate, onCreate, dark }) {
  // Stats
  const total = matches.length;
  const openNow = matches.filter(m => m.status === 'OPEN').length;
  const confirmed = matches.flatMap(m => m.slots).filter(s => s.status === 'BOOKED').length;
  const awaitingApproval = matches.filter(m => m.status === 'PENDING_APPROVAL').length;

  // Upcoming = matches with at least one booked slot whose date is in future
  const now = new Date('2026-05-26');
  const upcoming = matches
    .flatMap(m => m.slots.filter(s => s.status === 'BOOKED' && new Date(s.start) >= now)
      .map(s => ({ match:m, slot:s })))
    .sort((a,b) => new Date(a.slot.start) - new Date(b.slot.start));

  // Awaiting result
  const awaitingResult = matches
    .flatMap(m => m.slots.filter(s => s.status === 'BOOKED' && new Date(s.start) < now && s.home_score == null && s.played)
      .map(s => ({ match:m, slot:s })));

  // Recent activity = recent offers
  const recent = [...matches].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);

  const gap = density === 'compact' ? 10 : density === 'comfy' ? 18 : 14;
  const pad = density === 'compact' ? 14 : density === 'comfy' ? 22 : 18;

  return (
    <div style={{ background: t.bg, minHeight:'100%', paddingBottom: 110 }}>
      {/* HERO */}
      {variant === 'stadium'
        ? <StadiumHero t={t} dark={dark} matches={matches}
            openNow={openNow} confirmed={confirmed} awaitingApproval={awaitingApproval} total={total}/>
        : <ClassicHero t={t} total={total} openNow={openNow} confirmed={confirmed} dark={dark}/>}

      <div style={{ padding:`8px ${pad}px`, display:'flex', flexDirection:'column', gap: gap*1.6 }}>
        {/* QUICK ACTIONS */}
        <section>
          <SectionHeader t={t} variant={variant} title="Quick actions"/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap }}>
            <QuickAction t={t} variant={variant} icon="plus" title="New offer"
              subtitle="Share a link with guest coaches"
              onClick={onCreate} highlight/>
            <QuickAction t={t} variant={variant} icon="matches" title="My matches"
              subtitle={`${total} total · ${openNow} open`}
              onClick={() => onNavigate('manage')}/>
          </div>
        </section>

        {/* AWAITING RESULT — only if any */}
        {awaitingResult.length > 0 && (
          <section>
            <SectionHeader t={t} variant={variant} title="Save a result"/>
            {awaitingResult.map(({match, slot}) => (
              <AwaitingResultCard key={slot.id} t={t} variant={variant} dark={dark}
                match={match} slot={slot}
                onClick={() => onNavigate('manage', { focusSlot: slot.id })}/>
            ))}
          </section>
        )}

        {/* UPCOMING */}
        <section>
          <SectionHeader t={t} variant={variant} title="Upcoming matches"
            action={upcoming.length ? 'See all →' : null}
            onAction={() => onNavigate('manage')}/>
          {upcoming.length === 0 ? (
            <EmptyState t={t} icon="calendar" title="No matches scheduled"
              hint="Create an offer to share with guest clubs."/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap }}>
              {upcoming.slice(0,3).map(({match, slot}) => (
                <UpcomingCard key={slot.id} t={t} variant={variant} dark={dark}
                  match={match} slot={slot}
                  onClick={() => onNavigate('manage', { focusSlot: slot.id })}/>
              ))}
            </div>
          )}
        </section>

        {/* RECENT ACTIVITY */}
        <section>
          <SectionHeader t={t} variant={variant} title="Recent activity"/>
          <Card t={t} variant={variant} style={{ overflow:'hidden' }}>
            {recent.map((m, i) => (
              <ActivityRow key={m.id} t={t} variant={variant} match={m}
                isLast={i === recent.length-1}
                onClick={() => onNavigate('manage', { focusMatch: m.id })}/>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// CLASSIC hero
// ──────────────────────────────────────────────────────────
function ClassicHero({ t, total, openNow, confirmed, dark }) {
  const hour = 14; // demo: afternoon
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div style={{ padding:'12px 18px 8px' }}>
      <div style={{ fontSize:14, color:t.textSecondary, fontWeight:500, marginTop:8 }}>
        {greeting},
      </div>
      <div style={{ fontSize:30, fontWeight:800, color:t.text, letterSpacing:-0.6, marginBottom: 16 }}>
        Coach Daniels
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 10 }}>
        <StatCardClassic t={t} label="Total" value={total} color={t.primary} icon="ball"/>
        <StatCardClassic t={t} label="Open" value={openNow} color={t.success} icon="flag"/>
        <StatCardClassic t={t} label="Confirmed" value={confirmed} color={t.info} icon="check"/>
      </div>
    </div>
  );
}

function StatCardClassic({ t, label, value, color, icon }) {
  return (
    <div style={{
      background: t.card, borderRadius: 16, padding:'12px 12px 10px',
      borderTop: `3px solid ${color}`, border:`1px solid ${t.divider}`,
      boxShadow: `0 1px 3px ${t.shadow}`,
      display:'flex', flexDirection:'column', gap:6, minHeight:88,
    }}>
      <div style={{
        width:30, height:30, borderRadius:9, background:`${color}1A`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <MSIcon name={icon} size={16} color={color}/>
      </div>
      <div style={{ fontSize:26, fontWeight:800, color:t.text, letterSpacing:-0.5, lineHeight:1 }}>
        {value}
      </div>
      <div style={{ fontSize:11, fontWeight:600, color:t.textSecondary,
        letterSpacing:0.6, textTransform:'uppercase' }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// STADIUM hero — full-bleed scoreboard
// ──────────────────────────────────────────────────────────
function StadiumHero({ t, dark, matches, openNow, confirmed, awaitingApproval, total }) {
  return (
    <div style={{
      position:'relative', overflow:'hidden',
      background:`linear-gradient(160deg, ${t.scoreboardBg} 0%, ${t.scoreboardSurface} 100%)`,
      color: t.scoreboardText,
      padding:'14px 18px 24px',
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      marginBottom: 14,
    }}>
      <PitchBackdrop t={t} dark={dark} opacity={0.7}/>
      <div style={{ position:'relative' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8, marginBottom:18,
          fontFamily:'"Space Mono", ui-monospace, monospace',
          fontSize:10, letterSpacing:1.5, color:t.primary, fontWeight:700,
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:t.primary,
            boxShadow:`0 0 8px ${t.primary}` }}/>
          LIVE · RIVERSIDE ROVERS FC
        </div>
        <div style={{ fontSize:13, color:t.scoreboardMuted, fontWeight:500, marginBottom:2 }}>
          Good afternoon,
        </div>
        <div style={{ fontSize:32, fontWeight:800, letterSpacing:-0.8, color:'#FFFFFF',
          marginBottom: 18 }}>
          Coach Daniels
        </div>

        {/* LED-style stat board */}
        <div style={{
          background: 'rgba(0,0,0,0.30)',
          border: `1px solid ${t.primary}30`,
          borderRadius: 8, padding:'14px 16px',
          display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8,
        }}>
          <LedStat label="Open" value={openNow} color={t.success}/>
          <LedStat label="Booked" value={confirmed} color={t.info}/>
          <LedStat label="Pending" value={awaitingApproval} color={t.warning}/>
        </div>
      </div>
    </div>
  );
}

function LedStat({ label, value, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{
        fontFamily:'"Space Mono", ui-monospace, monospace',
        fontSize:32, fontWeight:700, color: color,
        textShadow:`0 0 12px ${color}80`, letterSpacing: -1, lineHeight:1.0,
      }}>{String(value).padStart(2,'0')}</div>
      <div style={{
        fontFamily:'"Space Mono", ui-monospace, monospace',
        fontSize:9, color:'rgba(255,255,255,0.6)',
        letterSpacing:1.4, textTransform:'uppercase', marginTop:6, fontWeight:700,
      }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Quick action tile
// ──────────────────────────────────────────────────────────
function QuickAction({ t, variant, icon, title, subtitle, onClick, highlight }) {
  if (variant === 'stadium') {
    const bg = highlight
      ? `linear-gradient(135deg, ${t.primary} 0%, ${t.primaryDark} 100%)`
      : t.card;
    const fg = highlight ? (t.dark?'#06140C':'#FFFFFF') : t.text;
    const sub = highlight ? (t.dark?'#06140C99':'#FFFFFFB0') : t.textSecondary;
    return (
      <Press onClick={onClick}>
        <div style={{
          background: bg, borderRadius:12, padding:'14px',
          border: highlight ? 'none' : `1px solid ${t.cardBorder}`,
          boxShadow: highlight ? `0 8px 24px ${t.glow}` : 'none',
          display:'flex', flexDirection:'column', gap:8, minHeight: 108,
          position:'relative', overflow:'hidden',
        }}>
          {/* corner cut */}
          <div style={{ position:'absolute', top:0, right:0,
            width:0, height:0, borderTop:`16px solid ${highlight?'rgba(0,0,0,0.18)':t.bg}`,
            borderLeft:'16px solid transparent' }}/>
          <div style={{ width:34, height:34, borderRadius:8,
            background: highlight ? 'rgba(255,255,255,0.18)' : t.secondary,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MSIcon name={icon} size={18} color={highlight ? fg : t.primary} stroke={2.4}/>
          </div>
          <div style={{ fontFamily:'"Space Mono", ui-monospace, monospace',
            fontSize:11, color:sub, letterSpacing:1.2, textTransform:'uppercase', fontWeight:700 }}>
            {title}
          </div>
          <div style={{ fontSize:13, color:sub, lineHeight:1.35,
            marginTop:'auto' }}>{subtitle}</div>
        </div>
      </Press>
    );
  }
  // CLASSIC
  const bg = highlight ? t.primary : t.card;
  const fg = highlight ? (t.dark?'#06140C':'#FFFFFF') : t.text;
  const sub = highlight ? (t.dark?'#06140C99':'#FFFFFFCC') : t.textSecondary;
  return (
    <Press onClick={onClick}>
      <div style={{
        background: bg, borderRadius: 18, padding: '14px',
        border: highlight ? 'none' : `1px solid ${t.divider}`,
        boxShadow: highlight ? `0 8px 24px ${t.glow}` : `0 1px 3px ${t.shadow}`,
        display:'flex', flexDirection:'column', gap:6, minHeight: 108,
      }}>
        <div style={{ width:38, height:38, borderRadius:12,
          background: highlight ? 'rgba(255,255,255,0.2)' : t.secondary,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MSIcon name={icon} size={20} color={highlight ? fg : t.primary} stroke={2.2}/>
        </div>
        <div style={{ fontSize:16, fontWeight:700, color: fg, marginTop: 4, letterSpacing:-0.2 }}>
          {title}
        </div>
        <div style={{ fontSize:12.5, color: sub, lineHeight:1.35 }}>{subtitle}</div>
      </div>
    </Press>
  );
}

// ──────────────────────────────────────────────────────────
// Upcoming card
// ──────────────────────────────────────────────────────────
function UpcomingCard({ t, variant, match, slot, onClick, dark }) {
  if (variant === 'stadium') {
    return (
      <Press onClick={onClick}>
        <div style={{
          background: t.card, border:`1px solid ${t.cardBorder}`,
          borderLeft: `3px solid ${t.info}`, borderRadius:10,
          padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ textAlign:'center', minWidth:46 }}>
            <div style={{ fontFamily:'"Space Mono", ui-monospace, monospace',
              fontSize:10, color:t.textSecondary, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
              {fmtDate(slot.start).split(' ').slice(0,1)[0]}
            </div>
            <div style={{ fontFamily:'"Space Mono", ui-monospace, monospace',
              fontSize:22, fontWeight:700, color:t.text, lineHeight:1 }}>
              {new Date(slot.start).getDate()}
            </div>
            <div style={{ fontFamily:'"Space Mono", ui-monospace, monospace',
              fontSize:9, color:t.primary, fontWeight:700, letterSpacing:0.8, marginTop:2 }}>
              {months[new Date(slot.start).getMonth()].toUpperCase()}
            </div>
          </div>
          <div style={{ width:1, alignSelf:'stretch', background:t.divider }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <FormationChip format={match.format} t={t} dark={dark} variant={variant}/>
              <span style={{ fontFamily:'"Space Mono", ui-monospace, monospace',
                fontSize:11, color:t.textSecondary, fontWeight:700, letterSpacing:0.5 }}>
                {match.age_group}
              </span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:2,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              vs {slot.guest_club}
            </div>
            <div style={{ fontSize:11.5, color:t.textSecondary, fontFamily:'"Space Mono", ui-monospace, monospace' }}>
              {fmtTimeRange(slot.start, match.duration)} · {match.location.split('·')[1]?.trim() || match.location}
            </div>
          </div>
        </div>
      </Press>
    );
  }
  // CLASSIC
  return (
    <Press onClick={onClick}>
      <div style={{
        background: t.card, borderRadius: 18, padding:'14px 16px',
        border:`1px solid ${t.divider}`, boxShadow:`0 1px 3px ${t.shadow}`,
        display:'flex', gap: 14, alignItems:'center',
      }}>
        <div style={{
          width:48, height:54, borderRadius:12, background:t.primaryLight,
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          <div style={{ fontSize:10, fontWeight:700, color:t.primaryDark,
            letterSpacing:1, textTransform:'uppercase' }}>
            {months[new Date(slot.start).getMonth()]}
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:t.primaryDark, lineHeight:1 }}>
            {new Date(slot.start).getDate()}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15.5, fontWeight:700, color:t.text, marginBottom: 2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            vs {slot.guest_club}
          </div>
          <div style={{ fontSize:12.5, color:t.textSecondary, marginBottom: 6 }}>
            {match.age_group} · {match.format} · {fmtTime(slot.start)}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:t.textSecondary }}>
            <MSIcon name="pin" size={12} color={t.textSecondary}/>
            <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {match.location}
            </span>
          </div>
        </div>
        <MSIcon name="chevron-r" size={18} color={t.textTertiary}/>
      </div>
    </Press>
  );
}

// ──────────────────────────────────────────────────────────
// Awaiting result row
// ──────────────────────────────────────────────────────────
function AwaitingResultCard({ t, variant, match, slot, onClick, dark }) {
  return (
    <Press onClick={onClick}>
      <div style={{
        background: variant === 'stadium'
          ? `linear-gradient(135deg, ${t.warning}18, ${t.warning}06)`
          : `${t.warning}10`,
        border:`1px solid ${t.warning}40`, borderRadius:14,
        padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ width:36, height:36, borderRadius:10,
          background:t.warning+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MSIcon name="trophy" size={18} color={t.warning}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:2 }}>
            How did the match go?
          </div>
          <div style={{ fontSize:12, color:t.textSecondary }}>
            vs {slot.guest_club} · {fmtDate(slot.start)}
          </div>
        </div>
        <MSIcon name="chevron-r" size={18} color={t.textTertiary}/>
      </div>
    </Press>
  );
}

// ──────────────────────────────────────────────────────────
// Activity row
// ──────────────────────────────────────────────────────────
function ActivityRow({ t, variant, match, isLast, onClick }) {
  const bookedSlot = match.slots.find(s => s.status === 'BOOKED');
  return (
    <Press onClick={onClick}>
      <div style={{
        padding:'12px 16px', display:'flex', alignItems:'center', gap:12,
        borderBottom: isLast ? 'none' : `1px solid ${t.divider}`,
      }}>
        <StatusDot status={match.status} t={t} size={9}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:t.text,
            display:'flex', alignItems:'center', gap:6 }}>
            <span>{match.age_group} {match.format}</span>
            {variant === 'stadium' && (
              <span style={{ fontFamily:'"Space Mono", ui-monospace, monospace',
                fontSize:10, color:t.textTertiary, letterSpacing:0.6 }}>
                · {match.slots.length} SLOTS
              </span>
            )}
            {variant !== 'stadium' && (
              <span style={{ fontSize:12, color:t.textTertiary }}>
                · {match.slots.length} slots
              </span>
            )}
          </div>
          <div style={{ fontSize:12, color:t.textSecondary, marginTop:2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {bookedSlot ? `Booked by ${bookedSlot.guest_club}` : match.location}
          </div>
        </div>
        <StatusPill status={match.status} t={t} variant={variant} dark={t.dark}/>
      </div>
    </Press>
  );
}

// ──────────────────────────────────────────────────────────
// Empty state
// ──────────────────────────────────────────────────────────
function EmptyState({ t, icon, title, hint }) {
  return (
    <div style={{
      padding:'28px 16px', borderRadius:16, border:`1px dashed ${t.cardBorder}`,
      display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      background: t.card,
    }}>
      <div style={{ width:44, height:44, borderRadius:14, background:t.secondary,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <MSIcon name={icon} size={22} color={t.primary}/>
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:t.text }}>{title}</div>
      <div style={{ fontSize:12.5, color:t.textSecondary, textAlign:'center' }}>{hint}</div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
