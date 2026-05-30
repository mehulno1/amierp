// ERP screens in Direction A (Heritage Industrial)
// Login + Dashboard + Sales/Quotations + Requisitions + CRM + Inventory
const ATt = window.A_TOKENS;

// ─────────────────────────────────────────────────────────────────────
//  LOGIN — split-screen with photography
// ─────────────────────────────────────────────────────────────────────

const LoginA = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', height: '100%', fontFamily: 'IBM Plex Sans' }}>
    {/* LEFT — branded photography */}
    <div style={{ position: 'relative', background: ATt.ink, overflow: 'hidden' }}>
      <Photo src={PHOTOS.steelMill} ratio="auto" tone="dark" style={{ height: '100%' }}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,17,23,.55) 0%, rgba(13,17,23,.85) 100%)' }}/>

      <div style={{ position: 'absolute', top: 40, left: 48 }}>
        <Wordmark variant="dark" sub="ERP" size={26}/>
      </div>

      <div style={{ position: 'absolute', bottom: 56, left: 48, right: 48, color: ATt.paper }}>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: ATt.warm, marginBottom: 20,
          display: 'inline-flex', alignItems: 'center', gap: 12,
        }}><span style={{ width: 28, height: 1, background: ATt.warm }}/>Ami ERP · v4.0</div>
        <h2 style={{
          fontFamily: 'IBM Plex Serif', fontWeight: 300,
          fontSize: 56, lineHeight: 1.05, margin: 0, letterSpacing: '-0.03em',
          maxWidth: 540,
        }}>
          One workbench for sales, requisitions, CRM, <span style={{ fontStyle: 'italic', color: ATt.warm }}>and the plant floor.</span>
        </h2>
        <div style={{
          marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24, borderTop: `1px solid ${ATt.rule}`, paddingTop: 24,
        }}>
          {[
            ['2,418', 'Open orders today'],
            ['184', 'Live RFQs'],
            ['98.7%', 'On-time dispatch · 30d'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 28, lineHeight: 1, color: ATt.paper, letterSpacing: '-0.01em' }}>{v}</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: ATt.mute, marginTop: 8 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* RIGHT — login form */}
    <div style={{ background: ATt.paper, color: ATt.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: ATt.warmDk, marginBottom: 24 }}>
          Sign in
        </div>
        <h1 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 48, lineHeight: 1, margin: 0, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Welcome back.
        </h1>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, color: ATt.muteLt, marginTop: 8, marginBottom: 40 }}>
          Use your work email. SSO available for plant supervisors.
        </p>

        {[
          { l: 'Work email', v: 'vikram.m@amiglobal.in', t: 'email' },
          { l: 'Password', v: '••••••••••••', t: 'password' },
        ].map((f) => (
          <div key={f.l} style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, display: 'block', marginBottom: 8 }}>{f.l}</label>
            <input type={f.t} defaultValue={f.v} style={{
              width: '100%', padding: '12px 14px',
              border: `1px solid ${ATt.ruleLt.replace('0.10','0.25')}`,
              background: '#fff', color: ATt.ink,
              fontFamily: 'IBM Plex Sans', fontSize: 15, outline: 'none',
            }}/>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: ATt.muteLt, cursor: 'pointer' }}>
            <span style={{ width: 14, height: 14, border: `1.5px solid ${ATt.ink}`, background: ATt.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={11} color={ATt.warm}/>
            </span>
            Keep me signed in for 14 days
          </label>
          <a href="#" style={{ fontSize: 13, color: ATt.warmDk, fontWeight: 500 }}>Forgot?</a>
        </div>

        <button style={{
          width: '100%', background: ATt.warm, color: ATt.ink, border: 'none',
          padding: '16px 24px',
          fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 13,
          letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>Sign in to ERP <Icon name="arrow" size={16}/></button>

        <div style={{
          marginTop: 24, padding: '14px 16px',
          border: `1px dashed ${ATt.ruleLt.replace('0.10','0.3')}`,
          fontSize: 12, color: ATt.muteLt, lineHeight: 1.5,
          fontFamily: 'IBM Plex Sans',
        }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.16em', color: ATt.warmDk, marginRight: 8 }}>SSO</span>
          Plant supervisors — sign in with Microsoft Entra at the kiosk.
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  ERP SHELL — sidebar + topbar (reused for all internal screens)
// ─────────────────────────────────────────────────────────────────────

const ErpShell = ({ active, breadcrumb, title, actions, children, dense = false }) => {
  const navItems = [
    { k: 'dashboard',     label: 'Dashboard',     icon: 'chart' },
    { k: 'sales',         label: 'Sales & Quotes',icon: 'doc' },
    { k: 'requisitions',  label: 'Requisitions',  icon: 'cart' },
    { k: 'crm',           label: 'CRM · Enquiry', icon: 'users' },
    { k: 'inventory',     label: 'Inventory',     icon: 'box' },
    { k: 'production',    label: 'Production',    icon: 'wrench' },
    { k: 'reports',       label: 'Reports',       icon: 'eye' },
    { k: 'settings',      label: 'Settings',      icon: 'settings' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100%', background: ATt.paper, fontFamily: 'IBM Plex Sans', color: ATt.ink }}>
      {/* sidebar */}
      <aside style={{ background: ATt.ink, color: ATt.paper, padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${ATt.rule}`, marginBottom: 16 }}>
          <Wordmark variant="dark" sub="ERP" size={22}/>
        </div>
        {/* org selector */}
        <div style={{ padding: '0 12px 12px' }}>
          <button style={{
            width: '100%', background: 'rgba(245,241,234,.06)', color: ATt.paper,
            border: `1px solid ${ATt.rule}`, padding: '10px 14px',
            fontFamily: 'IBM Plex Sans', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ATt.warm }}></span>
              Ami Enterprises
            </span>
            <span style={{ color: ATt.mute }}>▾</span>
          </button>
        </div>
        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((n) => (
            <a key={n.k} href="#" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 14px',
              fontSize: 13, fontWeight: 500,
              color: n.k === active ? ATt.ink : ATt.mute,
              background: n.k === active ? ATt.warm : 'transparent',
              textDecoration: 'none', letterSpacing: '.01em',
              borderLeft: n.k === active ? `3px solid ${ATt.warmDk}` : '3px solid transparent',
              marginLeft: n.k === active ? -3 : 0,
            }}>
              <Icon name={n.icon} size={15}/> {n.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${ATt.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: ATt.warm, color: ATt.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Serif', fontWeight: 600, fontSize: 14 }}>VM</div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, color: ATt.paper, fontWeight: 500 }}>Vikram Mehra</div>
            <div style={{ fontSize: 11, color: ATt.mute, fontFamily: 'IBM Plex Mono', letterSpacing: '.1em' }}>SALES · ADMIN</div>
          </div>
        </div>
      </aside>

      {/* content */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* topbar */}
        <div style={{
          padding: '14px 28px', borderBottom: `1px solid ${ATt.ruleLt}`,
          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 16,
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', background: ATt.paperAlt, color: ATt.muteLt,
              fontSize: 13, width: 320,
            }}>
              <Icon name="search" size={14}/>
              <span style={{ color: ATt.muteLt }}>Search orders, customers, parts… </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'IBM Plex Mono', fontSize: 10, color: ATt.muteLt, padding: '2px 6px', background: '#fff', border: `1px solid ${ATt.ruleLt.replace('0.10','0.25')}` }}>⌘ K</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'IBM Plex Mono', fontSize: 10, color: ATt.muteLt, letterSpacing: '.16em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fb56f' }}></span>
              ERP · ONLINE
            </div>
            <div style={{ position: 'relative' }}>
              <Icon name="bell" size={18}/>
              <span style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%', background: ATt.warm }}/>
            </div>
          </div>
        </div>

        {/* breadcrumb + title */}
        <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${ATt.ruleLt}` }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 10 }}>
            {breadcrumb.join('  ›  ')}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <h1 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 36, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: dense ? '20px 28px' : '24px 28px', overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  reusable bits
// ─────────────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, delta, deltaPositive = true, sub }) => (
  <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: '20px' }}>
    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 14 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 38, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {delta && (
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          color: deltaPositive ? '#3f8d54' : '#b6432f',
        }}>
          {deltaPositive ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
    {sub && <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: ATt.muteLt, marginTop: 8 }}>{sub}</div>}
  </div>
);

const StatusPill = ({ kind, label }) => {
  const map = {
    open:      { bg: 'rgba(217,114,71,.12)',  fg: ATt.warmDk },
    confirmed: { bg: 'rgba(63,141,84,.12)',   fg: '#3f8d54' },
    delivered: { bg: 'rgba(63,141,84,.12)',   fg: '#3f8d54' },
    draft:     { bg: 'rgba(20,15,11,.06)',    fg: ATt.muteLt },
    review:    { bg: 'rgba(74,144,217,.12)',  fg: '#2563a8' },
    overdue:   { bg: 'rgba(182,67,47,.14)',   fg: '#b6432f' },
    low:       { bg: 'rgba(182,67,47,.14)',   fg: '#b6432f' },
    healthy:   { bg: 'rgba(63,141,84,.12)',   fg: '#3f8d54' },
    hot:       { bg: 'rgba(217,114,71,.18)',  fg: ATt.warmDk },
    warm:      { bg: 'rgba(74,144,217,.12)',  fg: '#2563a8' },
    cold:      { bg: 'rgba(20,15,11,.06)',    fg: ATt.muteLt },
  };
  const s = map[kind] || map.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.fg,
      padding: '4px 10px', fontFamily: 'IBM Plex Mono', fontSize: 10,
      letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg }}/>
      {label}
    </span>
  );
};

const PrimaryBtn = ({ children, icon }) => (
  <button style={{
    background: ATt.ink, color: ATt.paper, border: 'none',
    padding: '10px 16px', fontFamily: 'IBM Plex Sans', fontWeight: 600,
    fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
  }}>
    {icon && <Icon name={icon} size={14}/>}
    {children}
  </button>
);
const SecondaryBtn = ({ children, icon }) => (
  <button style={{
    background: '#fff', color: ATt.ink,
    border: `1px solid ${ATt.ruleLt.replace('0.10','0.3')}`,
    padding: '10px 16px', fontFamily: 'IBM Plex Sans', fontWeight: 500,
    fontSize: 12, letterSpacing: '.04em', textTransform: 'uppercase',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
  }}>
    {icon && <Icon name={icon} size={14}/>}
    {children}
  </button>
);

// Tiny inline bar chart (SVG)
const BarChart = ({ data, height = 120, accent = ATt.warm }) => {
  const max = Math.max(...data.map(d => d.v));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 6, alignItems: 'end', height }}>
      {data.map((d, i) => (
        <div key={d.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: `${(d.v / max) * 100}%`, background: i === data.length - 1 ? accent : ATt.ink, opacity: i === data.length - 1 ? 1 : 0.85 }}/>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: ATt.muteLt, letterSpacing: '.08em' }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────

const DashboardA = () => (
  <ErpShell
    active="dashboard"
    breadcrumb={['Ami Enterprises', 'Dashboard']}
    title="Operations · this week"
    actions={<>
      <SecondaryBtn icon="filter">Filter</SecondaryBtn>
      <SecondaryBtn icon="download">Export</SecondaryBtn>
      <PrimaryBtn icon="plus">New quotation</PrimaryBtn>
    </>}
  >
    {/* metrics */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      <MetricCard label="Open quotations" value="184" delta="12%" sub="vs last week"/>
      <MetricCard label="Confirmed orders" value="₹4.82 Cr" delta="8.4%" sub="58 orders this week"/>
      <MetricCard label="Pending requisitions" value="42" delta="3" deltaPositive={false} sub="awaiting purchase approval"/>
      <MetricCard label="On-time dispatch" value="98.7%" delta="0.9%" sub="rolling 30 days"/>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
      {/* chart */}
      <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 8 }}>Weekly throughput · tonnes shipped</div>
            <div style={{ fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>3,842 <span style={{ fontSize: 18, color: ATt.muteLt }}>t this week</span></div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7D', '4W', 'QTR'].map((t, i) => (
              <span key={t} style={{
                padding: '6px 10px', fontFamily: 'IBM Plex Mono', fontSize: 10,
                letterSpacing: '.12em', background: i === 1 ? ATt.ink : 'transparent',
                color: i === 1 ? ATt.paper : ATt.muteLt,
                border: `1px solid ${i === 1 ? ATt.ink : ATt.ruleLt.replace('0.10','0.3')}`,
              }}>{t}</span>
            ))}
          </div>
        </div>
        <BarChart data={[
          { l: 'M14', v: 540 }, { l: 'M21', v: 620 }, { l: 'M28', v: 580 },
          { l: 'A04', v: 720 }, { l: 'A11', v: 690 }, { l: 'A18', v: 850 },
          { l: 'A25', v: 780 }, { l: 'M02', v: 920 }, { l: 'M09', v: 880 },
          { l: 'M14', v: 950 },
        ]} height={140}/>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${ATt.ruleLt}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            ['Lancing pipes', '1,420 t', 64],
            ['ERW line pipe', '1,180 t', 52],
            ['LPG cylinders', '622 t equiv', 28],
            ['Briquettes', '620 t', 26],
          ].map(([k, v, p]) => (
            <div key={k}>
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: ATt.ink, fontWeight: 500 }}>{k}</div>
              <div style={{ fontFamily: 'IBM Plex Serif', fontSize: 18, marginTop: 2 }}>{v}</div>
              <div style={{ height: 3, background: ATt.paperAlt, marginTop: 6 }}>
                <div style={{ height: '100%', width: `${p}%`, background: ATt.warm }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* activity feed */}
      <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt }}>Live activity</div>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#3f8d54', letterSpacing: '.1em' }}>● LIVE</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['09:41', 'Quotation Q-2026-2418 sent', 'Tata Steel · Jamshedpur', ATt.warm],
            ['09:34', 'PO-7740 confirmed by Reliance', '₹ 64.2 L · 320t ERW', '#3f8d54'],
            ['09:18', 'RFQ from HPCL · 14.2 kg LPG cyl.', 'Routed to Plant 03', ATt.ink],
            ['08:52', 'Stockout warning · 21.3mm seamless', 'Wada bay 04 · raise PR', '#b6432f'],
            ['08:44', 'Dispatch DSP-1182 left Khopoli', 'Vehicle MH-04-AB-9112', '#3f8d54'],
            ['08:30', 'New enquiry · IOCL South', 'Routed to Sanjay Kulkarni', ATt.ink],
          ].map(([t, head, sub, color], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '50px 8px 1fr',
              gap: 10, padding: '11px 0',
              borderTop: i > 0 ? `1px solid ${ATt.ruleLt}` : 'none',
              alignItems: 'flex-start',
            }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: ATt.muteLt }}>{t}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 6 }}/>
              <div>
                <div style={{ fontSize: 13, color: ATt.ink, fontWeight: 500 }}>{head}</div>
                <div style={{ fontSize: 11, color: ATt.muteLt, marginTop: 2, fontFamily: 'IBM Plex Mono', letterSpacing: '.02em' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* secondary row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
      <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: 20 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 14 }}>Top customers · MTD</div>
        {[
          ['Tata Steel', '₹ 1.84 Cr', 38],
          ['Reliance Industries', '₹ 1.42 Cr', 30],
          ['HPCL', '₹ 92 L', 19],
          ['JSW Steel', '₹ 64 L', 13],
        ].map(([n, v, p]) => (
          <div key={n} style={{ padding: '10px 0', borderTop: `1px solid ${ATt.ruleLt}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'IBM Plex Serif' }}>{n}</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{v}</span>
            </div>
            <div style={{ height: 3, background: ATt.paperAlt }}>
              <div style={{ height: '100%', width: `${p * 1.5}%`, background: ATt.warm }}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: 20 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 14 }}>Inventory · attention needed</div>
        {[
          ['21.3 × 1.6mm seamless', '8t', 'low'],
          ['168 OD × 6.4 ERW', '24t', 'low'],
          ['14.2 kg cyl. blanks', '4,800', 'healthy'],
          ['CR coil · CRCA', '120t', 'healthy'],
        ].map(([sku, q, k], i) => (
          <div key={sku} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${ATt.ruleLt}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{sku}</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: ATt.muteLt, marginTop: 2 }}>{q} on hand</div>
            </div>
            <StatusPill kind={k} label={k === 'low' ? 'Reorder' : 'Healthy'}/>
          </div>
        ))}
      </div>

      <div style={{ background: ATt.ink, color: ATt.paper, padding: 20 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.warm, marginBottom: 14 }}>Today's quick actions</div>
        {[
          ['Approve 4 pending requisitions', 'wrench'],
          ['Review 12 quotes awaiting price sign-off', 'doc'],
          ['Confirm dispatch for PO-7740 → Reliance', 'cart'],
          ['Reply to 6 new CRM enquiries', 'users'],
        ].map(([t, ic]) => (
          <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${ATt.rule}` }}>
            <Icon name={ic} size={16} color={ATt.warm}/>
            <span style={{ fontSize: 13, color: ATt.paper, flex: 1 }}>{t}</span>
            <Icon name="arrow" size={14} color={ATt.mute}/>
          </div>
        ))}
      </div>
    </div>
  </ErpShell>
);

// ─────────────────────────────────────────────────────────────────────
//  SALES / QUOTATIONS
// ─────────────────────────────────────────────────────────────────────

const SalesA = () => (
  <ErpShell
    active="sales"
    breadcrumb={['Ami Enterprises', 'Sales & Quotations']}
    title="Quotations"
    actions={<>
      <SecondaryBtn icon="filter">Filters · 3</SecondaryBtn>
      <SecondaryBtn icon="download">Export CSV</SecondaryBtn>
      <PrimaryBtn icon="plus">New quotation</PrimaryBtn>
    </>}
  >
    {/* tabs */}
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${ATt.ruleLt}`, marginBottom: 16 }}>
      {[
        ['All', '418'], ['Draft', '24'], ['Sent', '162'], ['Negotiating', '38'], ['Won', '184'], ['Lost', '10'],
      ].map(([l, c], i) => (
        <div key={l} style={{
          padding: '12px 18px',
          fontFamily: 'IBM Plex Sans', fontSize: 13, fontWeight: 500,
          color: i === 2 ? ATt.ink : ATt.muteLt,
          borderBottom: i === 2 ? `2px solid ${ATt.warm}` : '2px solid transparent',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {l}
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: ATt.muteLt, letterSpacing: '.05em' }}>{c}</span>
        </div>
      ))}
    </div>

    {/* metrics strip */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      <MetricCard label="Pipeline value" value="₹ 12.4 Cr" delta="6.2%" sub="184 active quotes"/>
      <MetricCard label="Avg. quote → order" value="4.2 d" delta="0.3 d" deltaPositive={false} sub="last 30 days"/>
      <MetricCard label="Win rate" value="68.4%" delta="2.1%" sub="rolling 90 days"/>
      <MetricCard label="Avg. ticket" value="₹ 6.7 L" delta="₹ 0.4 L" sub="all customers"/>
    </div>

    {/* table */}
    <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}` }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '110px 1.4fr 1.2fr 1fr 100px 110px 60px',
        background: ATt.paperAlt, padding: '12px 20px', gap: 16,
        fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em',
        textTransform: 'uppercase', color: ATt.muteLt,
      }}>
        <span>Quote No.</span><span>Customer</span><span>Items</span><span>Value</span><span>Valid</span><span>Status</span><span></span>
      </div>
      {[
        { id: 'Q-26-2418', c: 'Tata Steel · Jamshedpur',     it: '21.3mm seamless · 320t',     v: '₹ 38.4 L',  va: '14 d', s: 'review' },
        { id: 'Q-26-2417', c: 'Reliance Industries · Jamnagar', it: 'API 5L X42 line pipe · 420t', v: '₹ 64.2 L',  va: '7 d',  s: 'confirmed' },
        { id: 'Q-26-2416', c: 'HPCL · Visakh',                it: '14.2 kg LPG cylinder · 12k', v: '₹ 92.1 L',  va: '21 d', s: 'open' },
        { id: 'Q-26-2415', c: 'JSW Steel · Vijayanagar',      it: 'Lancing pipe · 180t',        v: '₹ 22.0 L',  va: '5 d',  s: 'overdue' },
        { id: 'Q-26-2414', c: 'Maruti Suzuki · Manesar',      it: 'CRW chassis tube · 60t',     v: '₹ 14.4 L',  va: '14 d', s: 'review' },
        { id: 'Q-26-2413', c: 'BPCL · Mumbai Refinery',       it: 'ASTM A106B · 240t',          v: '₹ 41.8 L',  va: '10 d', s: 'open' },
        { id: 'Q-26-2412', c: 'Indian Oil · Paradip',         it: 'API 5L Gr.B · 510t',         v: '₹ 78.3 L',  va: '3 d',  s: 'draft' },
        { id: 'Q-26-2411', c: 'Saint-Gobain · Bhiwadi',       it: 'Briquettes · 1,200t',         v: '₹ 28.0 L',  va: '14 d', s: 'confirmed' },
      ].map((r, i) => (
        <div key={r.id} style={{
          display: 'grid', gridTemplateColumns: '110px 1.4fr 1.2fr 1fr 100px 110px 60px',
          padding: '14px 20px', gap: 16, alignItems: 'center',
          borderTop: i > 0 ? `1px solid ${ATt.ruleLt}` : 'none',
        }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: ATt.warmDk, fontWeight: 600 }}>{r.id}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.c}</span>
          <span style={{ fontSize: 12, color: ATt.muteLt, fontFamily: 'IBM Plex Mono' }}>{r.it}</span>
          <span style={{ fontFamily: 'IBM Plex Serif', fontSize: 16 }}>{r.v}</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: ATt.muteLt }}>{r.va}</span>
          <StatusPill kind={r.s} label={r.s}/>
          <span style={{ textAlign: 'right', color: ATt.muteLt }}><Icon name="arrow" size={16}/></span>
        </div>
      ))}
    </div>
  </ErpShell>
);

// ─────────────────────────────────────────────────────────────────────
//  REQUISITIONS
// ─────────────────────────────────────────────────────────────────────

const RequisitionsA = () => (
  <ErpShell
    active="requisitions"
    breadcrumb={['Ami Enterprises', 'Requisitions']}
    title="Purchase requisitions"
    actions={<>
      <SecondaryBtn icon="filter">All plants</SecondaryBtn>
      <PrimaryBtn icon="plus">New requisition</PrimaryBtn>
    </>}
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
      {/* table */}
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['Pending approval · 42', 'Approved · 18', 'PO issued · 86', 'Closed · 312'].map((t, i) => (
            <div key={t} style={{
              padding: '8px 14px', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 500,
              background: i === 0 ? ATt.ink : '#fff',
              color: i === 0 ? ATt.paper : ATt.muteLt,
              border: `1px solid ${i === 0 ? ATt.ink : ATt.ruleLt.replace('0.10','0.25')}`,
            }}>{t}</div>
          ))}
        </div>

        <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}` }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1.4fr 1fr 100px 110px',
            background: ATt.paperAlt, padding: '12px 16px', gap: 12,
            fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em',
            textTransform: 'uppercase', color: ATt.muteLt,
          }}>
            <span>PR No.</span><span>Item</span><span>Plant · raised by</span><span>Value</span><span>Status</span>
          </div>
          {[
            { id: 'PR-3401', it: 'HR coil 2.5mm · 80t',          p: 'Khopoli · S. Patil',   v: '₹ 42.8 L', s: 'overdue', d: 'awaiting since 2d' },
            { id: 'PR-3400', it: 'Seamless billets · 120t',       p: 'Wada · R. Joshi',      v: '₹ 86.4 L', s: 'open',    d: 'normal · 1d' },
            { id: 'PR-3399', it: 'Cyl. blanks · 18,000 nos',     p: 'Daman · A. Shah',      v: '₹ 1.42 Cr', s: 'review',  d: 'with finance' },
            { id: 'PR-3398', it: 'Welding wire · 4t',            p: 'Khopoli · S. Patil',   v: '₹ 6.4 L',  s: 'confirmed', d: 'PO to be raised' },
            { id: 'PR-3397', it: 'Lubricants · 800 L',           p: 'Wada · R. Joshi',      v: '₹ 1.8 L',  s: 'open',    d: 'normal · 3d' },
            { id: 'PR-3396', it: 'Cutting tools batch',          p: 'Khopoli · M. Iyer',    v: '₹ 4.2 L',  s: 'draft',   d: 'editing' },
          ].map((r, i) => (
            <div key={r.id} style={{
              display: 'grid', gridTemplateColumns: '100px 1.4fr 1fr 100px 110px',
              padding: '14px 16px', gap: 12, alignItems: 'center',
              borderTop: i > 0 ? `1px solid ${ATt.ruleLt}` : 'none',
            }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: ATt.warmDk, fontWeight: 600 }}>{r.id}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.it}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: ATt.muteLt, marginTop: 2 }}>{r.d}</div>
              </div>
              <span style={{ fontSize: 12, color: ATt.muteLt }}>{r.p}</span>
              <span style={{ fontFamily: 'IBM Plex Serif', fontSize: 16 }}>{r.v}</span>
              <StatusPill kind={r.s} label={r.s}/>
            </div>
          ))}
        </div>
      </div>

      {/* detail panel */}
      <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 6 }}>PR-3401 · Detail</div>
            <h2 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 26, margin: 0, letterSpacing: '-0.01em' }}>HR coil 2.5mm · 80 tonnes</h2>
          </div>
          <StatusPill kind="overdue" label="Overdue 2d"/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, paddingTop: 24, borderTop: `1px solid ${ATt.ruleLt}`, marginTop: 16 }}>
          {[
            ['Plant', 'Khopoli · Bay 04'],
            ['Raised by', 'S. Patil · Production'],
            ['Need by', '24 May 2026'],
            ['Estimated value', '₹ 42.8 L'],
            ['Linked SO', 'SO-7740 · Reliance'],
            ['Vendor (proposed)', 'Essar Steel'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 4 }}>{k}</div>
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: ATt.muteLt, marginBottom: 14 }}>Approval chain</div>
          {[
            { who: 'S. Patil', role: 'Raised', when: '12 May, 09:14', done: true },
            { who: 'M. Iyer',  role: 'Plant head · approved', when: '12 May, 14:20', done: true },
            { who: 'V. Mehra', role: 'Sales head · awaiting', when: 'overdue 2d', done: false, current: true },
            { who: 'Finance',   role: 'CFO sign-off', when: 'pending', done: false },
          ].map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 12, padding: '10px 0', alignItems: 'center' }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: a.done ? '#3f8d54' : (a.current ? ATt.warm : ATt.paperAlt),
                border: `2px solid ${a.done ? '#3f8d54' : (a.current ? ATt.warmDk : ATt.ruleLt.replace('0.10','0.3'))}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{a.done && <Icon name="check" size={9} color="#fff"/>}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.who}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: ATt.muteLt }}>{a.role}</div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: a.current ? '#b6432f' : ATt.muteLt }}>{a.when}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <PrimaryBtn icon="check">Approve & issue PO</PrimaryBtn>
          <SecondaryBtn>Reject</SecondaryBtn>
          <SecondaryBtn>Comment</SecondaryBtn>
        </div>
      </div>
    </div>
  </ErpShell>
);

// ─────────────────────────────────────────────────────────────────────
//  CRM / ENQUIRIES — kanban
// ─────────────────────────────────────────────────────────────────────

const CrmA = () => {
  const cols = [
    { k: 'new',          t: 'New enquiry',   c: 18, kind: 'hot' },
    { k: 'qualified',    t: 'Qualified',     c: 32, kind: 'warm' },
    { k: 'quoted',       t: 'Quoted',        c: 28, kind: 'open' },
    { k: 'negotiation',  t: 'Negotiating',   c: 12, kind: 'review' },
    { k: 'won',          t: 'Won',           c: 86, kind: 'confirmed' },
  ];
  const cards = {
    new: [
      { c: 'GAIL India', t: 'API 5L X65 line pipe', v: '₹ 1.2 Cr est.', age: '2h', tag: 'hot' },
      { c: 'Bharat Forge', t: 'CRW chassis tube · sample run', v: '₹ 18 L est.', age: '5h', tag: 'warm' },
      { c: 'Adani Energy', t: 'ERW transmission · 2km', v: '₹ 86 L est.', age: '1d', tag: 'hot' },
    ],
    qualified: [
      { c: 'IOCL · Mathura', t: '21.3mm seamless · 480t', v: '₹ 58 L', age: '2d', tag: 'warm' },
      { c: 'Mahindra · Nashik', t: 'CRW · auto frame · 90t', v: '₹ 22 L', age: '4d', tag: 'warm' },
      { c: 'Tata Power', t: 'Briquettes · annual contract', v: '₹ 1.6 Cr', age: '1w', tag: 'hot' },
    ],
    quoted: [
      { c: 'Reliance · Jamnagar', t: 'API 5L X42 · 420t', v: '₹ 64.2 L', age: '3d', tag: 'warm' },
      { c: 'HPCL · Visakh', t: 'LPG cyl · 12,000 nos', v: '₹ 92.1 L', age: '5d', tag: 'warm' },
      { c: 'NTPC', t: 'Briquettes pilot · 200t', v: '₹ 5.2 L', age: '6d', tag: 'cold' },
    ],
    negotiation: [
      { c: 'Tata Steel', t: 'Lancing pipe ARC · 12-mo', v: '₹ 4.2 Cr', age: '12d', tag: 'hot' },
      { c: 'JSW Steel · Salem', t: 'Seamless · multi-OD', v: '₹ 64 L', age: '8d', tag: 'warm' },
    ],
    won: [
      { c: 'Maruti Suzuki', t: 'CRW · chassis · 60t', v: '₹ 14.4 L', age: 'this wk', tag: 'cold' },
      { c: 'BPCL · Mumbai', t: 'ASTM A106B · 240t', v: '₹ 41.8 L', age: 'this wk', tag: 'cold' },
    ],
  };

  return (
    <ErpShell
      active="crm"
      breadcrumb={['Ami Enterprises', 'CRM', 'Enquiries']}
      title="Enquiry pipeline"
      actions={<>
        <SecondaryBtn icon="filter">My desk · 24</SecondaryBtn>
        <PrimaryBtn icon="plus">Log enquiry</PrimaryBtn>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, height: '100%' }}>
        {cols.map((col) => (
          <div key={col.k} style={{ background: ATt.paperAlt, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.kind === 'hot' ? ATt.warm : col.kind === 'confirmed' ? '#3f8d54' : col.kind === 'review' ? '#2563a8' : ATt.muteLt }}/>
                <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 13 }}>{col.t}</span>
              </div>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: ATt.muteLt }}>{col.c}</span>
            </div>

            {(cards[col.k] || []).map((card, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}`, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'IBM Plex Serif', fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{card.c}</div>
                  <StatusPill kind={card.tag} label={card.tag}/>
                </div>
                <div style={{ fontSize: 12, color: ATt.muteLt, lineHeight: 1.4, marginBottom: 12, fontFamily: 'IBM Plex Sans' }}>{card.t}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px solid ${ATt.ruleLt}` }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 600, color: ATt.ink }}>{card.v}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: ATt.muteLt, letterSpacing: '.05em' }}>{card.age}</span>
                </div>
              </div>
            ))}

            <button style={{
              padding: '10px', background: 'transparent', border: `1px dashed ${ATt.ruleLt.replace('0.10','0.3')}`,
              color: ATt.muteLt, fontFamily: 'IBM Plex Sans', fontSize: 12, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}><Icon name="plus" size={12}/> Add card</button>
          </div>
        ))}
      </div>
    </ErpShell>
  );
};

// ─────────────────────────────────────────────────────────────────────
//  INVENTORY
// ─────────────────────────────────────────────────────────────────────

const InventoryA = () => (
  <ErpShell
    active="inventory"
    breadcrumb={['Ami Enterprises', 'Inventory', 'Finished goods']}
    title="Inventory · finished goods"
    actions={<>
      <SecondaryBtn icon="filter">All plants · 3</SecondaryBtn>
      <SecondaryBtn icon="download">Export stock card</SecondaryBtn>
      <PrimaryBtn icon="plus">Stock movement</PrimaryBtn>
    </>}
  >
    {/* tabs */}
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${ATt.ruleLt}`, marginBottom: 16 }}>
      {[
        ['Finished goods', '1,842 SKUs'],
        ['Raw material', '386 SKUs'],
        ['Consumables', '142 SKUs'],
        ['Scrap', '14 grades'],
      ].map(([l, c], i) => (
        <div key={l} style={{
          padding: '12px 18px', fontFamily: 'IBM Plex Sans', fontSize: 13, fontWeight: 500,
          color: i === 0 ? ATt.ink : ATt.muteLt,
          borderBottom: i === 0 ? `2px solid ${ATt.warm}` : '2px solid transparent',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {l}
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: ATt.muteLt }}>{c}</span>
        </div>
      ))}
    </div>

    {/* summary */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
      <MetricCard label="Total stock value" value="₹ 18.4 Cr" sub="across 3 plants"/>
      <MetricCard label="Slow movers" value="84" delta="6" deltaPositive={false} sub="aged > 60 days"/>
      <MetricCard label="Stockouts this week" value="12" delta="3" deltaPositive={false} sub="critical SKUs"/>
      <MetricCard label="Days on hand" value="42 d" delta="2 d" sub="weighted avg."/>
    </div>

    {/* table */}
    <div style={{ background: '#fff', border: `1px solid ${ATt.ruleLt}` }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '110px 1.6fr 1fr 90px 90px 100px 1fr 90px',
        background: ATt.paperAlt, padding: '12px 20px', gap: 14,
        fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em',
        textTransform: 'uppercase', color: ATt.muteLt,
      }}>
        <span>SKU</span><span>Description</span><span>Plant</span><span>On hand</span><span>Reserved</span><span>Min</span><span>Stock level</span><span>Status</span>
      </div>
      {[
        { sku: 'AE-LP-213-16', d: 'Lancing pipe · 21.3mm OD × 1.6mm', p: 'Wada · Bay 02', oh: '8 t',   re: '4 t',  mn: '24 t', pct: 14, s: 'low' },
        { sku: 'AP-ER-168-64', d: 'ERW pipe · 168 OD × 6.4mm',         p: 'Khopoli · Bay 01', oh: '24 t', re: '8 t', mn: '40 t', pct: 28, s: 'low' },
        { sku: 'AP-API-219-80',d: 'API 5L Gr.B · 219 OD × 8.0mm',      p: 'Khopoli · Bay 03', oh: '142 t',re: '40 t',mn: '60 t', pct: 78, s: 'healthy' },
        { sku: 'AC-CYL-142',   d: 'LPG cylinder · 14.2 kg · IS 3196', p: 'Daman',            oh: '4,800',re: '1,200',mn: '2,500',pct: 92, s: 'healthy' },
        { sku: 'AE-LP-219-20', d: 'Lancing pipe · 21.9mm × 2.0mm',     p: 'Wada · Bay 02',    oh: '88 t', re: '12 t', mn: '40 t', pct: 88, s: 'healthy' },
        { sku: 'AP-CRW-32-16', d: 'CRW tube · 32 OD × 1.6mm',          p: 'Khopoli · Bay 02', oh: '60 t', re: '8 t',  mn: '30 t', pct: 80, s: 'healthy' },
        { sku: 'AB-BRQ-S70',   d: 'Briquettes · agri biomass · 70mm',  p: 'Wada',             oh: '320 t',re: '0',    mn: '150 t',pct: 95, s: 'healthy' },
        { sku: 'AP-A106-114',  d: 'ASTM A106B · 114 OD × 6mm',         p: 'Khopoli · Bay 03', oh: '18 t', re: '14 t', mn: '40 t', pct: 12, s: 'low' },
      ].map((r, i) => (
        <div key={r.sku} style={{
          display: 'grid', gridTemplateColumns: '110px 1.6fr 1fr 90px 90px 100px 1fr 90px',
          padding: '14px 20px', gap: 14, alignItems: 'center',
          borderTop: i > 0 ? `1px solid ${ATt.ruleLt}` : 'none',
        }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: ATt.warmDk, fontWeight: 600 }}>{r.sku}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.d}</span>
          <span style={{ fontSize: 12, color: ATt.muteLt, fontFamily: 'IBM Plex Mono' }}>{r.p}</span>
          <span style={{ fontFamily: 'IBM Plex Serif', fontSize: 16 }}>{r.oh}</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: ATt.muteLt }}>{r.re}</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: ATt.muteLt }}>{r.mn}</span>
          <div>
            <div style={{ height: 6, background: ATt.paperAlt, position: 'relative' }}>
              <div style={{ height: '100%', width: `${r.pct}%`, background: r.pct < 30 ? '#b6432f' : r.pct < 60 ? ATt.warm : '#3f8d54' }}/>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: ATt.muteLt, marginTop: 4 }}>{r.pct}%</div>
          </div>
          <StatusPill kind={r.s} label={r.s === 'low' ? 'Reorder' : 'OK'}/>
        </div>
      ))}
    </div>
  </ErpShell>
);

Object.assign(window, { LoginA, DashboardA, SalesA, RequisitionsA, CrmA, InventoryA });
