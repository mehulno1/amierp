// Direction A — Heritage Industrial
// Deep charcoal-navy + warm off-white + copper accent.
// IBM Plex Serif display, IBM Plex Sans body, IBM Plex Mono for labels.

const A = {
  ink:     '#0d1117',     // primary dark
  inkSoft: '#1a1410',     // warm dark
  paper:   '#f5f1ea',     // warm off-white
  paperAlt:'#ece6d8',
  warm:    '#d97247',     // copper accent
  warmDk:  '#c25a30',
  rule:    'rgba(245,241,234,0.12)',
  ruleLt:  'rgba(20,15,10,0.10)',
  mute:    'rgba(245,241,234,0.65)',
  muteLt:  'rgba(20,15,10,0.55)',
};

// ── NAV ────────────────────────────────────────────────────────────────
const NavA = () => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 5,
    background: A.ink,
    borderBottom: `1px solid ${A.rule}`,
    color: A.paper,
  }}>
    {/* meta strip */}
    <div style={{
      borderBottom: `1px solid ${A.rule}`,
      padding: '8px 56px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'IBM Plex Mono', fontSize: 10,
      letterSpacing: '.16em', textTransform: 'uppercase',
      color: A.mute,
    }}>
      <div style={{ display: 'flex', gap: 28 }}>
        <span>ESTD · 1985</span>
        <span>ISO 9001:2015 · IS / BS / ASTM</span>
        <span>Mumbai · India</span>
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        <span>EN · हिंदी · ગુ</span>
        <span>+91 22 4000 0000</span>
        <span>contact@amiglobal.in</span>
      </div>
    </div>

    {/* primary row */}
    <div style={{
      padding: '20px 56px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      gap: 40,
    }}>
      <Wordmark variant="dark" sub="GROUP" size={30} />

      <nav style={{
        display: 'flex', gap: 36,
        fontFamily: 'IBM Plex Sans', fontWeight: 500, fontSize: 14,
        letterSpacing: '.02em',
        justifySelf: 'center',
      }}>
        {[
          ['Home', true], ['Companies', false], ['Products', false],
          ['Industries', false], ['Quality', false], ['About', false], ['Contact', false],
        ].map(([label, active]) => (
          <a key={label} href="#" style={{
            color: active ? A.paper : A.mute,
            textDecoration: 'none',
            paddingBottom: 4,
            borderBottom: active ? `1.5px solid ${A.warm}` : '1.5px solid transparent',
          }}>{label}</a>
        ))}
      </nav>

      <InlineLogin theme={{
        bg: 'rgba(245,241,234,.04)',
        border: 'rgba(245,241,234,.15)',
        text: A.paper,
        placeholder: 'rgba(245,241,234,.4)',
        btnBg: A.warm, btnFg: A.ink,
        mute: A.mute,
      }} />
    </div>
  </div>
);

// ── HERO ───────────────────────────────────────────────────────────────
const HeroA = () => (
  <section style={{ background: A.ink, color: A.paper, position: 'relative', overflow: 'hidden' }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      minHeight: 760,
    }}>
      {/* LEFT */}
      <div style={{ padding: '88px 56px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: A.warm, marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 28, height: 1, background: A.warm }}></span>
            Est. 1985 · Five companies, one heritage
          </div>

          <h1 style={{
            fontFamily: 'IBM Plex Serif',
            fontWeight: 300,
            fontSize: 88,
            lineHeight: 0.98,
            letterSpacing: '-0.035em',
            margin: 0,
            marginBottom: 32,
            color: A.paper,
          }}>
            Forging the
            <br/>
            <span style={{ fontStyle: 'italic', color: A.warm }}>backbone</span>
            <br/>
            of Indian industry.
          </h1>

          <p style={{
            fontFamily: 'IBM Plex Sans', fontWeight: 300,
            fontSize: 18, lineHeight: 1.55,
            color: A.mute, maxWidth: 520, margin: 0,
          }}>
            From the lancing pipes used by every major steel, copper and zinc producer
            in the country, to LPG cylinders, ERW tubing and bio-fuels — Ami Group has
            quietly built the materials behind four decades of Indian manufacturing.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            <button style={{
              background: A.warm, color: A.ink, border: 'none',
              padding: '16px 28px',
              fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 13,
              letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 12,
            }}>Explore Capabilities <Icon name="arrow" size={16}/></button>
            <button style={{
              background: 'transparent', color: A.paper, border: `1px solid ${A.rule}`,
              padding: '16px 28px',
              fontFamily: 'IBM Plex Sans', fontWeight: 500, fontSize: 13,
              letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>Request a quote</button>
          </div>
        </div>

        {/* hero metadata row */}
        <div style={{
          marginTop: 64,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24, borderTop: `1px solid ${A.rule}`, paddingTop: 28,
        }}>
          {[
            ['40+', 'Years in operation'],
            ['5', 'Group companies'],
            ['1.2M t', 'Annual steel throughput'],
            ['38', 'Countries served'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{
                fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 38,
                lineHeight: 1, color: A.paper, letterSpacing: '-0.02em',
              }}>{v}</div>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 10,
                letterSpacing: '.16em', textTransform: 'uppercase',
                color: A.mute, marginTop: 10,
              }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — photography */}
      <div style={{ position: 'relative' }}>
        <Photo src={PHOTOS.steelMill} label="hero · molten steel pour" tone="dark" style={{ aspectRatio: 'auto', height: '100%', width: '100%' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,17,23,.6) 0%, rgba(13,17,23,0) 30%)' }}/>
        {/* floating cred card */}
        <div style={{
          position: 'absolute', bottom: 40, right: 40,
          background: A.paper, color: A.ink,
          padding: '24px 28px', maxWidth: 280,
          fontFamily: 'IBM Plex Sans',
        }}>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 10,
            letterSpacing: '.18em', textTransform: 'uppercase',
            color: A.warmDk, marginBottom: 10,
          }}>Featured · Lancing pipes</div>
          <div style={{
            fontFamily: 'IBM Plex Serif', fontSize: 22, lineHeight: 1.2,
            fontWeight: 400, letterSpacing: '-0.01em',
          }}>
            India's most-used lancing pipe in primary steelmaking.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12, fontWeight: 500 }}>
            Read the spec sheet <Icon name="arrow-ne" size={14}/>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── GROUP COMPANIES ────────────────────────────────────────────────────
const CompaniesA = () => {
  const items = [
    { name: 'Ami Enterprises', tag: 'Lancing pipes', desc: 'Oxygen lancing pipes for primary steel, ferro alloy, zinc & copper producers.', photo: PHOTOS.steelMill },
    { name: 'Ami Pipes',       tag: 'ERW · HFW tubes', desc: 'API 5L Gr.B, A106B, A53B welded steel tubes for line pipe and structural use.', photo: PHOTOS.steelPipes },
    { name: 'Ami Cylinders',   tag: 'LPG cylinders', desc: 'High-pressure LPG cylinders to IS 3196, with full-spec testing in-house.', photo: PHOTOS.cylinders },
    { name: 'Zatakia Comm.',   tag: 'Trading', desc: 'Raw material sourcing and commercial trading across the group.', photo: PHOTOS.ironOre },
  ];
  return (
    <section style={{ background: A.paper, color: A.ink, padding: '120px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64 }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: A.warmDk, marginBottom: 16,
          }}>01 · The group</div>
          <h2 style={{
            fontFamily: 'IBM Plex Serif', fontWeight: 300,
            fontSize: 64, lineHeight: 1, margin: 0, letterSpacing: '-0.03em',
            maxWidth: 700,
          }}>Four companies. <span style={{ fontStyle: 'italic' }}>One</span> standard of quality.</h2>
        </div>
        <div style={{ maxWidth: 320 }}>
          <p style={{ fontFamily: 'IBM Plex Sans', fontWeight: 400, fontSize: 15, lineHeight: 1.6, color: A.muteLt, margin: 0 }}>
            Each company operates independently — but every product is built to the same
            uncompromising specification, tested in the same labs, and shipped under the
            same Ami name.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: A.ruleLt, border: `1px solid ${A.ruleLt}` }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: A.paper, padding: '24px 24px 32px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 10,
              letterSpacing: '.18em', textTransform: 'uppercase',
              color: A.warmDk, marginBottom: 16,
            }}>0{i + 1}</div>
            <Photo src={it.photo} ratio="4/3" label={it.tag} tone="dark" style={{ marginBottom: 20 }}/>
            <h3 style={{
              fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 22,
              margin: 0, marginBottom: 4, letterSpacing: '-0.01em',
            }}>{it.name}</h3>
            <div style={{
              fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 500,
              color: A.warmDk, marginBottom: 12, letterSpacing: '.02em',
            }}>{it.tag}</div>
            <p style={{
              fontFamily: 'IBM Plex Sans', fontSize: 13, lineHeight: 1.5,
              color: A.muteLt, margin: 0, flex: 1,
            }}>{it.desc}</p>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: A.ink }}>
              Visit company <Icon name="arrow-ne" size={14}/>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── CAPABILITIES / STATS ───────────────────────────────────────────────
const CapabilitiesA = () => (
  <section style={{ background: A.paper, color: A.ink, padding: '80px 56px 120px' }}>
    <div style={{ borderTop: `1px solid ${A.ruleLt}`, paddingTop: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: A.warmDk, marginBottom: 16,
          }}>02 · Capabilities</div>
          <h2 style={{
            fontFamily: 'IBM Plex Serif', fontWeight: 300,
            fontSize: 52, lineHeight: 1.05, margin: 0, letterSpacing: '-0.025em',
          }}>Built to specification.<br/><span style={{ fontStyle: 'italic' }}>Then</span> beyond it.</h2>
          <p style={{
            fontFamily: 'IBM Plex Sans', fontSize: 15, lineHeight: 1.65,
            color: A.muteLt, marginTop: 24, maxWidth: 380,
          }}>
            Three manufacturing plants. A dedicated quality lab equipped to
            IS / BS / ASTM and JIS standards. And a habit, going back four
            decades, of over-engineering everything.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 56, rowGap: 64 }}>
          <Stat value="1.2M" suffix="t" label="Annual steel pipe & tube capacity" color={A.ink} accent={A.warmDk}/>
          <Stat value="14" suffix=" mm" label="Smallest seamless lancing pipe wall thickness" color={A.ink} accent={A.warmDk}/>
          <Stat value="38" label="Export markets across Asia, EU, MENA & Africa" color={A.ink} accent={A.warmDk}/>
          <Stat value="100" suffix="%" label="In-house hydrostatic & ultrasonic NDT testing" color={A.ink} accent={A.warmDk}/>
        </div>
      </div>
    </div>
  </section>
);

// ── INDUSTRIES SERVED — image-led ───────────────────────────────────────
const IndustriesA = () => {
  const rows = [
    { idx: '01', name: 'Primary steelmaking', desc: 'Oxygen lancing for BOF, EAF and ladle metallurgy.', photo: PHOTOS.furnace },
    { idx: '02', name: 'Oil & gas', desc: 'API-grade ERW line pipe for transmission and distribution.', photo: PHOTOS.oilGas },
    { idx: '03', name: 'Automotive & furniture', desc: 'Cold-rolled welded tubes for chassis, frames and structural use.', photo: PHOTOS.warehouse },
    { idx: '04', name: 'LPG distribution', desc: 'Domestic and commercial cylinders to IS 3196.', photo: PHOTOS.cylinders },
  ];
  return (
    <section style={{ background: A.ink, color: A.paper, padding: '120px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64 }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: A.warm, marginBottom: 16,
          }}>03 · Industries we supply</div>
          <h2 style={{
            fontFamily: 'IBM Plex Serif', fontWeight: 300,
            fontSize: 64, lineHeight: 1, margin: 0, letterSpacing: '-0.03em', color: A.paper,
          }}>The mills, refineries, and pipelines<br/>that <span style={{ fontStyle: 'italic', color: A.warm }}>keep India running</span>.</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {rows.map((r) => (
          <div key={r.idx} style={{ background: A.inkSoft }}>
            <Photo src={r.photo} ratio="3/4" label={r.name} tone="dark"/>
            <div style={{ padding: '24px 24px 32px' }}>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 10,
                letterSpacing: '.18em', color: A.warm, marginBottom: 10,
              }}>{r.idx}</div>
              <h3 style={{
                fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 22,
                margin: 0, marginBottom: 10, letterSpacing: '-0.01em',
              }}>{r.name}</h3>
              <p style={{
                fontFamily: 'IBM Plex Sans', fontSize: 13, lineHeight: 1.55,
                color: A.mute, margin: 0,
              }}>{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── QUALITY · CERTIFICATIONS  ──────────────────────────────────────────
const QualityA = () => (
  <section style={{ background: A.ink, color: A.paper, padding: '0 56px 120px' }}>
    <div style={{ borderTop: `1px solid ${A.rule}`, paddingTop: 56 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 32,
      }}>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: A.mute,
        }}>Standards & certifications</div>
        <div style={{ fontSize: 12, color: A.mute, fontFamily: 'IBM Plex Sans' }}>Audited annually · last review Q4 2025</div>
      </div>
      <LogoStrip items={[
        { name: 'ISO 9001:2015' },
        { name: 'IS 3196 / 3601' },
        { name: 'API 5L' },
        { name: 'ASTM A106 / A53' },
        { name: 'BS EN 10210' },
        { name: 'JIS G 3454' },
        { name: 'PED 2014/68/EU' },
      ]} color={A.paper} size={18}/>
    </div>
  </section>
);

// ── LEGACY / LEADERSHIP — pull quote ───────────────────────────────────
const LegacyA = () => (
  <section style={{ background: A.paper, color: A.ink, padding: '160px 56px', position: 'relative' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'left' }}>
      <div style={{
        fontFamily: 'IBM Plex Mono', fontSize: 11,
        letterSpacing: '.22em', textTransform: 'uppercase',
        color: A.warmDk, marginBottom: 24,
      }}>04 · Leadership</div>
      <blockquote style={{
        fontFamily: 'IBM Plex Serif', fontWeight: 300,
        fontSize: 56, lineHeight: 1.1, margin: 0, letterSpacing: '-0.025em',
      }}>
        "The pipes we made in <span style={{ fontStyle: 'italic', color: A.warmDk }}>1985</span>
        are still in those mills today. That's not nostalgia —
        it's <span style={{ fontStyle: 'italic', color: A.warmDk }}>specification</span>.
        Build it once, build it right."
      </blockquote>
      <div style={{ marginTop: 48, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: A.inkSoft }}></div>
        <div>
          <div style={{ fontFamily: 'IBM Plex Serif', fontWeight: 500, fontSize: 18 }}>Suresh Zatakia</div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: A.muteLt, letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 4 }}>Founder & Chairman</div>
        </div>
      </div>
    </div>
  </section>
);

// ── CTA + FOOTER ───────────────────────────────────────────────────────
const CtaFooterA = () => (
  <>
    <section style={{ background: A.warm, color: A.ink, padding: '80px 56px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48 }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: A.ink, opacity: .7, marginBottom: 12,
          }}>Have a specification in hand?</div>
          <div style={{
            fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 44,
            lineHeight: 1.05, letterSpacing: '-0.02em',
          }}>Talk to a metallurgist, not a salesperson.</div>
        </div>
        <button style={{
          background: A.ink, color: A.warm, border: 'none',
          padding: '20px 32px',
          fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 13,
          letterSpacing: '.06em', textTransform: 'uppercase',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>Request a consultation <Icon name="arrow" size={16}/></button>
      </div>
    </section>

    <footer style={{ background: A.inkSoft, color: A.paper, padding: '64px 56px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, marginBottom: 48 }}>
        <div>
          <Wordmark variant="dark" sub="GROUP" size={28}/>
          <p style={{
            fontFamily: 'IBM Plex Sans', fontSize: 13, lineHeight: 1.6,
            color: A.mute, marginTop: 20, maxWidth: 300,
          }}>
            Ami Group · four companies, four decades, one obsession with
            doing the boring thing well.
          </p>
        </div>
        {[
          ['Companies', ['Ami Enterprises', 'Ami Pipes', 'Ami Cylinders', 'Zatakia Commercial']],
          ['Products', ['Lancing pipes', 'ERW line pipe', 'LPG cylinders', 'Custom fabrication', 'Raw material trading']],
          ['Company', ['About', 'Leadership', 'Plants', 'Careers', 'Press']],
          ['Contact', ['Mumbai HQ', 'Plant — Wada', 'Plant — Khopoli', 'Export desk', 'contact@amiglobal.in']],
        ].map(([title, links]) => (
          <div key={title}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 10,
              letterSpacing: '.18em', textTransform: 'uppercase',
              color: A.warm, marginBottom: 18,
            }}>{title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((l) => (
                <li key={l} style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: A.mute }}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        borderTop: `1px solid ${A.rule}`,
        paddingTop: 24,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'IBM Plex Mono', fontSize: 10,
        letterSpacing: '.16em', textTransform: 'uppercase',
        color: A.mute,
      }}>
        <div>© 2026 Ami Group · All rights reserved</div>
        <div style={{ display: 'flex', gap: 32 }}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Sitemap</span>
        </div>
      </div>
    </footer>
  </>
);

const HomeA = () => (
  <div style={{ background: A.ink }}>
    <NavA/>
    <HeroA/>
    <CompaniesA/>
    <CapabilitiesA/>
    <IndustriesA/>
    <QualityA/>
    <LegacyA/>
    <CtaFooterA/>
  </div>
);

Object.assign(window, { HomeA, A_TOKENS: A });
