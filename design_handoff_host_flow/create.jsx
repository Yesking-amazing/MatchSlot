// CreateScreen — 3-step wizard (Details → Time slots → Review)
function CreateScreen({ t, variant, dark, onClose, onCreate, toast }) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    age_group:'U14', format:'9v9', duration:80,
    location:'', notes:'',
    approver_email:'director@riversiderovers.club',
    slots:[],
  });
  const steps = ['Details','Time slots','Review'];

  // validation per step
  const canContinue = (() => {
    if (step === 0) return !!data.location.trim();
    if (step === 1) return data.slots.length > 0;
    if (step === 2) return !!data.approver_email.trim();
    return true;
  })();

  const next = () => {
    if (step < 2) setStep(step + 1);
    else {
      onCreate(data);
    }
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else onClose();
  };

  return (
    <div style={{ background: t.bg, minHeight:'100%', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{
        padding:'12px 16px 6px', display:'flex', alignItems:'center', gap:12,
        background: t.bg, position:'sticky', top:0, zIndex:5,
      }}>
        <Press onClick={back}>
          <div style={{
            width:36, height:36, borderRadius:12, background: t.secondary,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <MSIcon name={step===0?'x':'chevron-l'} size={18} color={t.primary}/>
          </div>
        </Press>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, color:t.textTertiary,
            letterSpacing:1, textTransform:'uppercase',
            fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace' : 'inherit' }}>
            Step {step+1} of 3
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:t.text }}>
            {variant==='stadium' ? 'NEW FIXTURE' : 'New match offer'}
          </div>
        </div>
        <div style={{ width:36 }}/>
      </div>

      <Stepper t={t} variant={variant} step={step} steps={steps}/>

      <div style={{ flex:1, overflow:'auto', padding:'4px 16px 16px' }}>
        {step === 0 && <StepDetails t={t} variant={variant} dark={dark} data={data} setData={setData}/>}
        {step === 1 && <StepSlots t={t} variant={variant} dark={dark} data={data} setData={setData}/>}
        {step === 2 && <StepReview t={t} variant={variant} dark={dark} data={data} setData={setData}/>}
      </div>

      {/* Footer CTA */}
      <div style={{
        padding:'12px 16px 16px',
        background: `linear-gradient(to top, ${t.bg} 70%, ${t.bg}00)`,
        position:'relative', zIndex:5,
      }}>
        <MSButton t={t} full title={
          step === 0 ? 'Next: time slots' :
          step === 1 ? 'Next: review' :
          'Send for approval'
        }
          icon={step===2?'sparkle':null}
          onClick={canContinue ? next : null} disabled={!canContinue}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Stepper
// ──────────────────────────────────────────────────────────
function Stepper({ t, variant, step, steps }) {
  return (
    <div style={{ padding:'4px 24px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {steps.map((label, i) => {
          const done = i < step, active = i === step;
          const color = done || active ? t.primary : t.cardBorder;
          return (
            <React.Fragment key={i}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:'0 0 auto' }}>
                <div style={{
                  width: variant==='stadium' ? 22 : 24,
                  height: variant==='stadium' ? 22 : 24,
                  borderRadius: variant==='stadium' ? 4 : 999,
                  background: done ? t.primary : active ? t.primary : 'transparent',
                  border: `1.5px solid ${color}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: done || active ? (t.dark?'#06140C':'#fff') : t.textTertiary,
                  fontSize:11, fontWeight:700,
                  fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace' : 'inherit',
                }}>
                  {done ? <MSIcon name="check" size={12} color={t.dark?'#06140C':'#fff'} stroke={3}/> : i+1}
                </div>
                <div style={{ fontSize:10.5, fontWeight: active?700:500,
                  color: active ? t.text : t.textTertiary,
                  letterSpacing: variant==='stadium' ? 0.8 : 0,
                  textTransform: variant==='stadium' ? 'uppercase' : 'none',
                  whiteSpace:'nowrap',
                }}>{label}</div>
              </div>
              {i < steps.length-1 && (
                <div style={{ flex:1, height:2, background: done ? t.primary : t.cardBorder,
                  borderRadius:1, marginTop:-14 }}/>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Form atoms
// ──────────────────────────────────────────────────────────
function FieldLabel({ t, variant, children }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 600,
      color: t.textSecondary,
      letterSpacing: variant==='stadium' ? 1 : 0.3,
      textTransform: variant==='stadium' ? 'uppercase' : 'none',
      marginBottom: 6,
      fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace' : 'inherit',
    }}>{children}</div>
  );
}

function TextField({ t, variant, label, value, onChange, placeholder, icon, multiline, dark }) {
  const radius = variant==='stadium' ? 8 : 14;
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel t={t} variant={variant}>{label}</FieldLabel>
      <div style={{
        display:'flex', alignItems: multiline ? 'flex-start' : 'center',
        gap:10, padding: multiline ? '12px 14px' : '0 14px',
        minHeight: multiline ? 90 : 48,
        background: t.inputBg, borderRadius: radius,
        border:`1px solid ${t.cardBorder}`,
      }}>
        {icon && <MSIcon name={icon} size={18} color={t.textSecondary}/>}
        {multiline ? (
          <textarea value={value} onChange={(e)=>onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex:1, border:'none', outline:'none', resize:'none', minHeight:64,
              fontSize:15, color:t.text, background:'transparent',
              fontFamily:'inherit', lineHeight:1.45,
            }}/>
        ) : (
          <input value={value} onChange={(e)=>onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex:1, border:'none', outline:'none',
              fontSize:15, color:t.text, background:'transparent',
              fontFamily:'inherit', height:48,
            }}/>
        )}
      </div>
    </div>
  );
}

function ChoiceField({ t, variant, label, value, options, onChange, renderOption }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <FieldLabel t={t} variant={variant}>{label}</FieldLabel>
      <div style={{
        display:'flex', gap:8, flexWrap:'wrap',
      }}>
        {options.map(o => {
          const selected = o === value;
          return (
            <Press key={o} onClick={() => onChange(o)} scaleTo={0.95}>
              <div style={{
                padding: variant==='stadium' ? '8px 14px' : '10px 16px',
                borderRadius: variant==='stadium' ? 6 : 999,
                background: selected ? t.primary : t.card,
                border: `1px solid ${selected ? t.primary : t.cardBorder}`,
                color: selected ? (t.dark?'#06140C':'#FFFFFF') : t.text,
                fontSize: 14, fontWeight: selected?700:500,
                fontFamily: variant==='stadium' && (typeof o === 'string' && o.match(/^\d/))
                  ? '"Space Mono", ui-monospace, monospace' : 'inherit',
                letterSpacing: variant==='stadium' ? 0.4 : 0,
                transition:'all 120ms',
                display:'flex', alignItems:'center', gap:8,
              }}>
                {renderOption ? renderOption(o, selected) : o}
              </div>
            </Press>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// STEP 1 — Details
// ──────────────────────────────────────────────────────────
function StepDetails({ t, variant, dark, data, setData }) {
  const set = (k,v) => setData({...data, [k]:v});
  return (
    <div style={{ animation:'ms-fade-in 240ms' }}>
      <ChoiceField t={t} variant={variant} label="Age group"
        value={data.age_group} options={AGE_GROUPS}
        onChange={(v)=>set('age_group', v)}/>

      <FieldLabel t={t} variant={variant}>Format</FieldLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:16 }}>
        {FORMATS.map(f => {
          const selected = f === data.format;
          return (
            <Press key={f} onClick={()=>set('format', f)} scaleTo={0.97}>
              <div style={{
                background: selected ? (variant==='stadium' ? t.scoreboardSurface : t.primaryLight) : t.card,
                border:`1.5px solid ${selected ? t.primary : t.cardBorder}`,
                borderRadius: variant==='stadium' ? 8 : 14,
                padding:'10px 12px',
                display:'flex', alignItems:'center', gap:10,
              }}>
                <FormationChip format={f} t={t} dark={dark} variant={variant} size="md"/>
                <div>
                  <div style={{
                    fontSize:15, fontWeight:700, color:t.text,
                    fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit',
                  }}>{f}</div>
                  <div style={{ fontSize:11, color:t.textSecondary }}>
                    {f==='5v5'?'10 players':f==='7v7'?'14 players':f==='9v9'?'18 players':'22 players'}
                  </div>
                </div>
              </div>
            </Press>
          );
        })}
      </div>

      <ChoiceField t={t} variant={variant} label="Duration"
        value={data.duration} options={DURATIONS}
        onChange={(v)=>set('duration', v)}
        renderOption={(o, sel) => <span>{o}<span style={{
          fontSize:11, marginLeft:2, opacity:0.65,
        }}>min</span></span>}
      />

      <TextField t={t} variant={variant} label="Venue / Pitch"
        icon="pin" value={data.location} onChange={(v)=>set('location',v)}
        placeholder="e.g. Riverside Park · Pitch 3" dark={dark}/>

      <TextField t={t} variant={variant} label="Notes (optional)"
        icon="note" value={data.notes} onChange={(v)=>set('notes',v)}
        placeholder="Anything guests should know — parking, kit, etc."
        multiline dark={dark}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// STEP 2 — Time slots
// ──────────────────────────────────────────────────────────
function StepSlots({ t, variant, dark, data, setData }) {
  const [showPicker, setShowPicker] = React.useState(false);

  const addSlot = (dateStr, timeStr) => {
    const iso = `${dateStr}T${timeStr}:00`;
    const newSlot = { id:`new-${Date.now()}`, start: iso, status:'PENDING_APPROVAL' };
    setData({...data, slots:[...data.slots, newSlot].sort((a,b)=>new Date(a.start)-new Date(b.start))});
    setShowPicker(false);
  };
  const removeSlot = (id) => setData({...data, slots: data.slots.filter(s => s.id !== id)});

  return (
    <div style={{ animation:'ms-fade-in 240ms' }}>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel t={t} variant={variant}>
          Available time slots
        </FieldLabel>
        <div style={{ fontSize:12.5, color:t.textSecondary, marginBottom:14 }}>
          Add the dates &amp; times you can host. Guest coaches will pick one.
        </div>
      </div>

      {data.slots.length === 0 ? (
        <EmptyState t={t} icon="calendar" title="No slots yet"
          hint="Tap below to add your first available time."/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: 8, marginBottom: 14 }}>
          {data.slots.map((s, idx) => (
            <SlotPickerRow key={s.id} t={t} variant={variant} slot={s} idx={idx}
              duration={data.duration}
              onRemove={() => removeSlot(s.id)}/>
          ))}
        </div>
      )}

      <Press onClick={() => setShowPicker(true)}>
        <div style={{
          padding:'14px 16px', borderRadius: variant==='stadium' ? 8 : 14,
          border:`1.5px dashed ${t.primary}80`,
          background: t.primaryLight,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          color:t.primary, fontSize:14.5, fontWeight:700,
        }}>
          <MSIcon name="plus" size={18} color={t.primary} stroke={2.4}/>
          Add a time slot
        </div>
      </Press>

      {showPicker && <DateTimePicker t={t} variant={variant}
        onAdd={addSlot} onClose={() => setShowPicker(false)}/>}
    </div>
  );
}

function SlotPickerRow({ t, variant, slot, idx, duration, onRemove }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'12px 14px', background: t.card,
      borderRadius: variant==='stadium' ? 8 : 14,
      border:`1px solid ${t.divider}`,
    }}>
      <div style={{
        width:32, height:32, borderRadius: variant==='stadium' ? 6 : 10,
        background: t.secondary, color: t.primary,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:13, fontWeight:700,
        fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit',
      }}>{String(idx+1).padStart(2,'0')}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:t.text }}>
          {fmtDate(slot.start)}
        </div>
        <div style={{ fontSize:12, color:t.textSecondary,
          fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit' }}>
          {fmtTimeRange(slot.start, duration)}
        </div>
      </div>
      <Press onClick={onRemove}>
        <div style={{
          width:32, height:32, borderRadius:10, background: `${t.error}15`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <MSIcon name="trash" size={15} color={t.error}/>
        </div>
      </Press>
    </div>
  );
}

// Mini date+time picker — quick presets for prototype feel.
function DateTimePicker({ t, variant, onAdd, onClose }) {
  // Generate next 14 days
  const today = new Date('2026-05-26');
  const dates = Array.from({length:21}, (_,i) => {
    const d = new Date(today); d.setDate(d.getDate() + i + 7);
    return d;
  });
  const times = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
  const [date, setDate] = React.useState(dates[0]);
  const [time, setTime] = React.useState('10:00');

  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0, background:'rgba(0,0,0,0.4)',
      zIndex:50, display:'flex', alignItems:'flex-end',
      animation:'ms-fade-in 200ms',
    }}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background: t.bg, width:'100%',
        borderTopLeftRadius: variant==='stadium' ? 18 : 28,
        borderTopRightRadius: variant==='stadium' ? 18 : 28,
        padding:'14px 18px 26px',
        animation:'ms-sheet-in 320ms cubic-bezier(.2,.8,.2,1)',
        maxHeight:'78%', overflow:'auto',
      }}>
        <div style={{ width:40, height:4, background:t.cardBorder, borderRadius:2,
          margin:'2px auto 14px' }}/>
        <div style={{ fontSize:18, fontWeight:800, color:t.text, marginBottom:14,
          letterSpacing:-0.3 }}>
          Pick a date &amp; time
        </div>

        <FieldLabel t={t} variant={variant}>Date</FieldLabel>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:6,
          marginBottom:16, marginLeft:-2, marginRight:-2, padding:'0 2px 6px' }}>
          {dates.map((d) => {
            const sel = d.getTime() === date.getTime();
            return (
              <Press key={d.toISOString()} onClick={()=>setDate(d)} scaleTo={0.92}>
                <div style={{
                  minWidth:56, padding:'10px 4px', borderRadius: variant==='stadium' ? 8 : 14,
                  background: sel ? t.primary : t.card,
                  border:`1px solid ${sel?t.primary:t.cardBorder}`,
                  color: sel ? (t.dark?'#06140C':'#FFFFFF') : t.text,
                  textAlign:'center',
                }}>
                  <div style={{ fontSize:10, fontWeight:600, opacity:0.7,
                    textTransform:'uppercase', letterSpacing:0.6,
                    fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit' }}>
                    {days[d.getDay()].slice(0,3)}
                  </div>
                  <div style={{ fontSize:18, fontWeight:800, lineHeight:1.1, marginTop:2,
                    fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit' }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize:10, fontWeight:600, opacity:0.7, marginTop:2 }}>
                    {months[d.getMonth()]}
                  </div>
                </div>
              </Press>
            );
          })}
        </div>

        <FieldLabel t={t} variant={variant}>Kick-off time</FieldLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8,
          marginBottom: 20 }}>
          {times.map(tm => {
            const sel = tm === time;
            return (
              <Press key={tm} onClick={()=>setTime(tm)} scaleTo={0.94}>
                <div style={{
                  padding:'10px 0', borderRadius: variant==='stadium' ? 6 : 12,
                  background: sel ? t.primary : t.card,
                  border:`1px solid ${sel?t.primary:t.cardBorder}`,
                  color: sel ? (t.dark?'#06140C':'#FFFFFF') : t.text,
                  fontSize:13.5, fontWeight:600, textAlign:'center',
                  fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit',
                }}>{tm}</div>
              </Press>
            );
          })}
        </div>

        <MSButton t={t} full title="Add slot" icon="check"
          onClick={() => onAdd(dateStr, time)}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// STEP 3 — Review
// ──────────────────────────────────────────────────────────
function StepReview({ t, variant, dark, data, setData }) {
  return (
    <div style={{ animation:'ms-fade-in 240ms' }}>
      <Card t={t} variant={variant} style={{ padding:'16px', marginBottom:14 }}>
        <div style={{
          fontSize:10.5, color: t.primary, fontWeight:700, letterSpacing:1,
          textTransform:'uppercase', marginBottom:10,
          fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit',
        }}>Match summary</div>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
          <FormationChip format={data.format} t={t} dark={dark} variant={variant} size="md"/>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:t.text, letterSpacing:-0.4,
              fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit' }}>
              {data.age_group} · {data.format}
            </div>
            <div style={{ fontSize:13, color:t.textSecondary }}>
              {data.duration} minutes
            </div>
          </div>
        </div>
        <ReviewRow t={t} icon="pin" label="Venue" value={data.location || '—'}/>
        {data.notes && <ReviewRow t={t} icon="note" label="Notes" value={data.notes}/>}
      </Card>

      <Card t={t} variant={variant} style={{ padding:'16px', marginBottom:14 }}>
        <div style={{
          fontSize:10.5, color: t.primary, fontWeight:700, letterSpacing:1,
          textTransform:'uppercase', marginBottom:12,
          fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit',
        }}>{data.slots.length} time slot{data.slots.length!==1?'s':''}</div>
        {data.slots.map((s,i) => (
          <div key={s.id} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'6px 0',
            borderTop: i===0 ? 'none' : `1px solid ${t.divider}`,
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:t.primary, width:24,
              fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit' }}>
              {String(i+1).padStart(2,'0')}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:t.text }}>{fmtDate(s.start)}</div>
              <div style={{ fontSize:12, color:t.textSecondary,
                fontFamily: variant==='stadium' ? '"Space Mono", ui-monospace, monospace':'inherit' }}>
                {fmtTimeRange(s.start, data.duration)}
              </div>
            </div>
          </div>
        ))}
      </Card>

      <TextField t={t} variant={variant}
        label="Approver email" icon="mail"
        value={data.approver_email}
        onChange={(v) => setData({...data, approver_email:v})}
        placeholder="approver@yourclub.com" dark={dark}/>

      <div style={{
        padding:'12px 14px', background: `${t.info}10`,
        borderRadius: variant==='stadium' ? 8 : 14,
        border:`1px solid ${t.info}30`, display:'flex', alignItems:'flex-start', gap:10,
        marginTop: 8,
      }}>
        <MSIcon name="shield" size={18} color={t.info}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:2 }}>
            Pre-approval keeps your slots safe
          </div>
          <div style={{ fontSize:12, color:t.textSecondary, lineHeight:1.4 }}>
            Your approver will get an email to review each time slot.
            Your offer goes live once they sign off.
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ t, icon, label, value }) {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0' }}>
      <MSIcon name={icon} size={16} color={t.textSecondary}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, color:t.textTertiary, fontWeight:600,
          textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
        <div style={{ fontSize:14, color:t.text, marginTop:2 }}>{value}</div>
      </div>
    </div>
  );
}

Object.assign(window, { CreateScreen });
