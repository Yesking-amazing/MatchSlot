// Pitch Green theme + sample data for the MatchSlot prototype.

function getTheme(dark) {
  if (dark) return {
    text:'#E8F5E9', textSecondary:'#8FA88F', textTertiary:'#5C7A5C',
    bg:'#0A1F12', bgAlt:'#122A1A',
    primary:'#4ADE80', primaryDark:'#1B8B4E', primaryLight:'rgba(74,222,128,0.10)',
    secondary:'rgba(74,222,128,0.12)', accent:'#86EFAC',
    card:'#122A1A', cardBorder:'#1E3D28', border:'#1E3D28', divider:'rgba(74,222,128,0.10)',
    success:'#4ADE80', warning:'#FBBF24', error:'#F87171', info:'#60A5FA',
    pitchLine:'rgba(74,222,128,0.08)',
    scoreboardBg:'#06140C', scoreboardSurface:'#0E2415', scoreboardText:'#E8F5E9',
    scoreboardMuted:'rgba(232,245,233,0.55)',
    shadow:'rgba(0,0,0,0.55)', glow:'rgba(74,222,128,0.30)',
    inputBg:'#0E2415', dark:true,
  };
  return {
    text:'#1A2E1A', textSecondary:'#4A6B4A', textTertiary:'#8FA88F',
    bg:'#F7FAF5', bgAlt:'#FFFFFF',
    primary:'#1B8B4E', primaryDark:'#157A42', primaryLight:'#E8F5E9',
    secondary:'rgba(27,139,78,0.08)', accent:'#16A34A',
    card:'#FFFFFF', cardBorder:'#D4E4D4', border:'#D4E4D4', divider:'rgba(27,139,78,0.10)',
    success:'#16A34A', warning:'#F59E0B', error:'#EF4444', info:'#2563EB',
    pitchLine:'rgba(27,139,78,0.12)',
    scoreboardBg:'#0F2818', scoreboardSurface:'#163524', scoreboardText:'#FFFFFF',
    scoreboardMuted:'rgba(255,255,255,0.55)',
    shadow:'rgba(26,46,26,0.10)', glow:'rgba(27,139,78,0.30)',
    inputBg:'#FFFFFF', dark:false,
  };
}

// Status color (semantic)
function statusColor(t, status) {
  switch (status) {
    case 'OPEN': return t.success;
    case 'HELD': return t.warning;
    case 'PENDING_APPROVAL': return t.warning;
    case 'BOOKED': return t.info;
    case 'REJECTED': return t.error;
    case 'CLOSED': return t.textSecondary;
    case 'CANCELLED': return t.textTertiary;
    default: return t.textSecondary;
  }
}

function statusLabel(s) {
  return ({
    OPEN:'Open', HELD:'Held', PENDING_APPROVAL:'Pending approval',
    BOOKED:'Booked', REJECTED:'Rejected', CLOSED:'Closed', CANCELLED:'Cancelled',
  })[s] || s;
}

// Sample data: mid-season coach with active matches in various states.
const SAMPLE_MATCHES = [
  {
    id:'m1', host_club:'Riverside Rovers FC', host_name:'Coach Daniels',
    age_group:'U14', format:'9v9', duration:80,
    location:'Riverside Park · Pitch 3',
    status:'OPEN',
    notes:'Friendlies to warm up for league. Changing rooms on-site.',
    created_at:'2026-05-22', share_token:'rvr-9v9-x42',
    slots:[
      { id:'s1', start:'2026-06-06T10:00', status:'OPEN' },
      { id:'s2', start:'2026-06-06T14:00', status:'OPEN' },
      { id:'s3', start:'2026-06-13T10:00', status:'HELD', held_by:'guest@athletico.co' },
      { id:'s4', start:'2026-06-13T14:00', status:'OPEN' },
    ],
  },
  {
    id:'m2', host_club:'Riverside Rovers FC', host_name:'Coach Daniels',
    age_group:'U12', format:'7v7', duration:60,
    location:'Riverside Park · Pitch 1',
    status:'CLOSED',
    created_at:'2026-05-15', share_token:'rvr-7v7-bk9',
    slots:[
      { id:'s5', start:'2026-05-31T11:00', status:'BOOKED',
        guest_club:'Hilltop Lions U12', guest_name:'M. Vesey',
        guest_contact:'mvesey@hilltop.club' },
      { id:'s6', start:'2026-06-01T11:00', status:'REJECTED' },
    ],
  },
  {
    id:'m3', host_club:'Riverside Rovers FC', host_name:'Coach Daniels',
    age_group:'U16', format:'11v11', duration:90,
    location:'Riverside Park · Pitch 4',
    status:'CLOSED', awaitingResult:true,
    created_at:'2026-05-08', share_token:'rvr-11v11-q1',
    slots:[
      { id:'s7', start:'2026-05-23T15:00', status:'BOOKED', played:true,
        guest_club:'Coastline Athletic', guest_name:'J. Park',
        guest_contact:'j.park@coastline.fc' },
    ],
  },
  {
    id:'m4', host_club:'Riverside Rovers FC', host_name:'Coach Daniels',
    age_group:'U10', format:'5v5', duration:60,
    location:'Hilltop Astro',
    status:'PENDING_APPROVAL',
    created_at:'2026-05-24', share_token:'rvr-5v5-z7',
    approver:'director@riversiderovers.club',
    slots:[
      { id:'s8', start:'2026-06-20T16:00', status:'PENDING_APPROVAL' },
      { id:'s9', start:'2026-06-21T11:00', status:'PENDING_APPROVAL' },
    ],
  },
];

const AGE_GROUPS = ['U8','U10','U12','U14','U16','U18','Open'];
const FORMATS = ['5v5','7v7','9v9','11v11'];
const DURATIONS = [60, 70, 80, 90, 100, 120];

Object.assign(window, { getTheme, statusColor, statusLabel,
  SAMPLE_MATCHES, AGE_GROUPS, FORMATS, DURATIONS });
