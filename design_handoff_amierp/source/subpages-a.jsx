// Marketing sub-pages in Direction A (Heritage Industrial)
// Uses A_TOKENS from direction-a.jsx
const At = window.A_TOKENS;

// ─────────────────────────────────────────────────────────────────────
//  ABOUT
// ─────────────────────────────────────────────────────────────────────

const AboutA = () => (
  <div style={{ background: At.ink, color: At.paper, fontFamily: 'IBM Plex Sans' }}>
    <NavA/>

    {/* Hero */}
    <section style={{ background: At.ink, padding: '88px 56px 96px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .3 }}>
        <Photo src={PHOTOS.steelMill} ratio="auto" tone="dark" style={{ height: '100%' }}/>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,17,23,.7) 0%, rgba(13,17,23,.95) 100%)' }}/>
      <div style={{ position: 'relative', maxWidth: 1100 }}>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: At.warm, marginBottom: 24,
          display: 'inline-flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 28, height: 1, background: At.warm }}/>About · Ami Group
        </div>
        <h1 style={{
          fontFamily: 'IBM Plex Serif', fontWeight: 300,
          fontSize: 96, lineHeight: 1, margin: 0,
          letterSpacing: '-0.035em', color: At.paper,
          maxWidth: 1000,
        }}>
          A family business that quietly became <span style={{ fontStyle: 'italic', color: At.warm }}>infrastructure</span>.
        </h1>
        <p style={{
          fontFamily: 'IBM Plex Sans', fontWeight: 300,
          fontSize: 20, lineHeight: 1.55,
          color: At.mute, maxWidth: 720, marginTop: 32,
        }}>
          From a single pipe shed in suburban Mumbai in 1985, to a five-company
          group whose products are now used by every major Indian steel mill,
          oil major, and LPG distributor.
        </p>
      </div>
    </section>

    {/* Timeline */}
    <section style={{ background: At.paper, color: At.ink, padding: '120px 56px' }}>
      <div style={{
        fontFamily: 'IBM Plex Mono', fontSize: 11,
        letterSpacing: '.22em', textTransform: 'uppercase',
        color: At.warmDk, marginBottom: 16,
      }}>01 · Timeline</div>
      <h2 style={{
        fontFamily: 'IBM Plex Serif', fontWeight: 300,
        fontSize: 56, lineHeight: 1, margin: 0, letterSpacing: '-0.03em', marginBottom: 64,
      }}>Four decades. <span style={{ fontStyle: 'italic' }}>One spec.</span></h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: At.ruleLt }}>
        {[
          { y: '1985', t: 'Founded', d: 'Suresh Zatakia opens the first lancing-pipe shed in Wada.' },
          { y: '1992', t: 'Ami Pipes', d: 'ERW tube line commissioned. First API-grade export order.' },
          { y: '2004', t: 'Ami Cylinders', d: 'LPG cylinder plant goes live. BIS approval, IS 3196.' },
          { y: '2015', t: 'Zatakia Comm.', d: 'Trading arm formalized for raw material consolidation.' },
          { y: '2021', t: 'Ami Bio Fuels', d: 'Biomass briquette line begins, agri-waste to industrial heat.' },
        ].map((it, i) => (
          <div key={it.y} style={{ background: At.paper, padding: '32px 24px' }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11,
              letterSpacing: '.18em', color: At.warmDk, marginBottom: 16,
            }}>0{i + 1}</div>
            <div style={{
              fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 48,
              lineHeight: 1, letterSpacing: '-0.02em', color: At.ink, marginBottom: 12,
            }}>{it.y}</div>
            <div style={{
              fontFamily: 'IBM Plex Serif', fontWeight: 500, fontSize: 18,
              marginBottom: 8, letterSpacing: '-0.01em',
            }}>{it.t}</div>
            <div style={{
              fontFamily: 'IBM Plex Sans', fontSize: 13, lineHeight: 1.5,
              color: At.muteLt,
            }}>{it.d}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Values / principles */}
    <section style={{ background: At.paper, color: At.ink, padding: '40px 56px 120px' }}>
      <div style={{ borderTop: `1px solid ${At.ruleLt}`, paddingTop: 80, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64 }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: At.warmDk, marginBottom: 16,
          }}>02 · Operating philosophy</div>
          <h2 style={{
            fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 52,
            lineHeight: 1.05, margin: 0, letterSpacing: '-0.025em',
          }}>Three things, repeated for forty years.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { n: '01', t: 'Sustainability', d: "Safe products, made safely. We're committed to protecting the environments — and people — we work alongside." },
            { n: '02', t: 'Quality',        d: "Audited every quarter to IS / BS / ASTM. Every batch. No exceptions." },
            { n: '03', t: 'Leadership',     d: "Recognize and reward the work. Train, retain, and back the people who actually make the pipes." },
          ].map((v) => (
            <div key={v.n} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr',
              padding: '32px 0', borderTop: `1px solid ${At.ruleLt}`,
              alignItems: 'start', gap: 24,
            }}>
              <div style={{
                fontFamily: 'IBM Plex Mono', fontSize: 12,
                letterSpacing: '.16em', color: At.warmDk,
              }}>{v.n}</div>
              <div>
                <h3 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 28, margin: 0, letterSpacing: '-0.01em' }}>{v.t}</h3>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, lineHeight: 1.6, color: At.muteLt, marginTop: 8, maxWidth: 560 }}>{v.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Plants */}
    <section style={{ background: At.ink, color: At.paper, padding: '120px 56px' }}>
      <div style={{ marginBottom: 64 }}>
        <div style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11,
          letterSpacing: '.22em', textTransform: 'uppercase',
          color: At.warm, marginBottom: 16,
        }}>03 · Where we manufacture</div>
        <h2 style={{
          fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 64,
          lineHeight: 1, margin: 0, letterSpacing: '-0.03em',
        }}>Three plants, one team.</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {[
          { name: 'Wada · Maharashtra', focus: 'Lancing pipes · seamless tubes', cap: '420 kt/yr', photo: PHOTOS.welding },
          { name: 'Khopoli · Maharashtra', focus: 'ERW · HFW tubes', cap: '560 kt/yr', photo: PHOTOS.pipeStack },
          { name: 'Daman · UT', focus: 'LPG cylinders', cap: '2.1 M units/yr', photo: PHOTOS.cylinders },
        ].map((p) => (
          <div key={p.name} style={{ background: At.inkSoft }}>
            <Photo src={p.photo} ratio="4/3" label={p.name.split(' ·')[0].toLowerCase()} tone="dark"/>
            <div style={{ padding: '24px 28px 32px' }}>
              <h3 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 24, margin: 0, marginBottom: 8 }}>{p.name}</h3>
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: At.warm, marginBottom: 16 }}>{p.focus}</div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingTop: 16, borderTop: `1px solid ${At.rule}`,
              }}>
                <div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: At.mute, marginBottom: 4 }}>Capacity</div>
                  <div style={{ fontFamily: 'IBM Plex Serif', fontWeight: 400, fontSize: 22 }}>{p.cap}</div>
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <Icon name="arrow-ne" size={18} color={At.warm}/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <CtaFooterA_ref/>
  </div>
);

// shared cta+footer rendered inline (re-using direction A's footer pattern,
// minimal copy to keep this file self-contained)
const CtaFooterA_ref = () => (
  <footer style={{ background: At.inkSoft, color: At.paper, padding: '64px 56px 32px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 40, marginBottom: 48 }}>
      <div>
        <Wordmark variant="dark" sub="GROUP" size={28}/>
        <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, lineHeight: 1.6, color: At.mute, marginTop: 20, maxWidth: 300 }}>
          Five companies, four decades, one obsession with doing the boring thing well.
        </p>
      </div>
      {[
        ['Companies', ['Ami Enterprises', 'Ami Pipes', 'Ami Cylinders', 'Ami Bio Fuels', 'Zatakia Commercial']],
        ['Products', ['Lancing pipes', 'ERW line pipe', 'LPG cylinders', 'Briquettes', 'Custom fabrication']],
        ['Company', ['About', 'Leadership', 'Plants', 'Careers', 'Press']],
        ['Contact', ['Mumbai HQ', 'Plant — Wada', 'Plant — Khopoli', 'Export desk', 'contact@amiglobal.in']],
      ].map(([title, links]) => (
        <div key={title}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: At.warm, marginBottom: 18 }}>{title}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {links.map((l) => <li key={l} style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: At.mute }}>{l}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div style={{
      borderTop: `1px solid ${At.rule}`, paddingTop: 24,
      display: 'flex', justifyContent: 'space-between',
      fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: At.mute,
    }}>
      <div>© 2026 Ami Group · All rights reserved</div>
      <div style={{ display: 'flex', gap: 32 }}>
        <span>Privacy</span><span>Terms</span><span>Sitemap</span>
      </div>
    </div>
  </footer>
);

// ─────────────────────────────────────────────────────────────────────
//  CONTACT
// ─────────────────────────────────────────────────────────────────────

const ContactA = () => (
  <div style={{ background: At.ink, color: At.paper, fontFamily: 'IBM Plex Sans' }}>
    <NavA/>

    <section style={{ background: At.ink, padding: '88px 56px 64px' }}>
      <div style={{
        fontFamily: 'IBM Plex Mono', fontSize: 11,
        letterSpacing: '.22em', textTransform: 'uppercase',
        color: At.warm, marginBottom: 24,
      }}>Contact</div>
      <h1 style={{
        fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 88,
        lineHeight: 1, margin: 0, letterSpacing: '-0.035em', maxWidth: 1100,
      }}>Tell us what you need.<br/><span style={{ fontStyle: 'italic', color: At.warm }}>We'll route it to the right desk.</span></h1>
    </section>

    {/* Form + sidebar */}
    <section style={{ background: At.paper, color: At.ink, padding: '80px 56px 120px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 80 }}>
        {/* form */}
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: At.warmDk, marginBottom: 32,
          }}>01 · Send a message</div>

          {[
            { l: 'Name', v: 'Vikram Mehra', t: 'text' },
            { l: 'Company', v: 'Tata Steel · Procurement', t: 'text' },
            { l: 'Email', v: 'v.mehra@tatasteel.in', t: 'email' },
            { l: 'Phone', v: '+91 98200 41122', t: 'tel' },
          ].map((f) => (
            <div key={f.l} style={{ marginBottom: 28 }}>
              <label style={{
                fontFamily: 'IBM Plex Mono', fontSize: 10,
                letterSpacing: '.18em', textTransform: 'uppercase',
                color: At.muteLt, display: 'block', marginBottom: 8,
              }}>{f.l}</label>
              <input type={f.t} defaultValue={f.v} style={{
                width: '100%', padding: '14px 0', border: 'none',
                borderBottom: `1.5px solid ${At.ink}`, background: 'transparent',
                fontFamily: 'IBM Plex Serif', fontSize: 22, color: At.ink,
                outline: 'none', letterSpacing: '-0.01em',
              }}/>
            </div>
          ))}

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: At.muteLt, display: 'block', marginBottom: 8 }}>I'm enquiring about</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Lancing pipes', 'ERW tubes', 'LPG cylinders', 'Bio briquettes', 'Custom spec', 'Trading'].map((opt, i) => (
                <div key={opt} style={{
                  padding: '10px 16px',
                  background: i === 0 ? At.ink : 'transparent',
                  color: i === 0 ? At.paper : At.ink,
                  border: `1px solid ${i === 0 ? At.ink : At.ruleLt.replace('0.10','0.3')}`,
                  fontFamily: 'IBM Plex Sans', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                }}>{opt}</div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: At.muteLt, display: 'block', marginBottom: 8 }}>Specification / message</label>
            <textarea defaultValue={"Need 320T of 21.3mm OD seamless lancing pipe, 1.6mm wall, IS 1239, for Q3 mill expansion at Jamshedpur. Need a quote + sample by 31 May."} style={{
              width: '100%', padding: '14px 0', border: 'none',
              borderBottom: `1.5px solid ${At.ink}`, background: 'transparent',
              fontFamily: 'IBM Plex Sans', fontSize: 16, color: At.ink,
              outline: 'none', minHeight: 100, resize: 'vertical', lineHeight: 1.5,
            }}/>
          </div>

          <button style={{
            background: At.warm, color: At.ink, border: 'none',
            padding: '18px 28px',
            fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 13,
            letterSpacing: '.06em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>Send to procurement <Icon name="arrow" size={16}/></button>
        </div>

        {/* sidebar */}
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: At.warmDk, marginBottom: 32,
          }}>02 · Direct lines</div>

          {[
            { t: 'Procurement / quotes', e: 'sales@amiglobal.in', p: '+91 22 4000 0010' },
            { t: 'Engineering / spec questions', e: 'eng@amiglobal.in', p: '+91 22 4000 0020' },
            { t: 'Quality / certifications', e: 'qa@amiglobal.in', p: '+91 22 4000 0030' },
            { t: 'Press & partnerships', e: 'press@amiglobal.in', p: '+91 22 4000 0040' },
          ].map((d) => (
            <div key={d.t} style={{
              padding: '20px 0', borderTop: `1px solid ${At.ruleLt}`,
            }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: At.muteLt, marginBottom: 6 }}>{d.t}</div>
              <div style={{ fontFamily: 'IBM Plex Serif', fontSize: 18, color: At.ink, letterSpacing: '-0.01em' }}>{d.e}</div>
              <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: At.muteLt, marginTop: 2 }}>{d.p}</div>
            </div>
          ))}

          <div style={{ marginTop: 48 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11,
              letterSpacing: '.22em', textTransform: 'uppercase',
              color: At.warmDk, marginBottom: 24,
            }}>03 · Visit us</div>
            <Photo src={PHOTOS.warehouse} ratio="4/3" label="HQ · Mumbai" tone="dark"/>
            <div style={{ marginTop: 16, fontFamily: 'IBM Plex Serif', fontSize: 18, lineHeight: 1.5 }}>
              Ami House<br/>
              Andheri (E), Mumbai 400 069<br/>
              <span style={{ color: At.muteLt, fontSize: 14 }}>Mon – Sat · 09:30 – 18:00 IST</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CtaFooterA_ref/>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
//  SUB-COMPANY (Ami Pipes as representative example)
// ─────────────────────────────────────────────────────────────────────

const SubCoA = () => (
  <div style={{ background: At.ink, color: At.paper, fontFamily: 'IBM Plex Sans' }}>
    <NavA/>

    {/* breadcrumb + hero */}
    <section style={{ background: At.ink, padding: '40px 56px 0' }}>
      <div style={{
        fontFamily: 'IBM Plex Mono', fontSize: 10,
        letterSpacing: '.18em', textTransform: 'uppercase',
        color: At.mute, paddingBottom: 32, borderBottom: `1px solid ${At.rule}`,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span>Group</span> <span>›</span> <span>Companies</span> <span>›</span> <span style={{ color: At.paper }}>Ami Pipes Pvt. Ltd.</span>
      </div>
    </section>

    <section style={{ background: At.ink, padding: '64px 56px 96px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: 11,
            letterSpacing: '.22em', textTransform: 'uppercase',
            color: At.warm, marginBottom: 20,
            display: 'inline-flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 28, height: 1, background: At.warm }}/>Company · 02 of 05
          </div>
          <h1 style={{
            fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 88,
            lineHeight: 0.98, margin: 0, letterSpacing: '-0.035em',
          }}>
            Ami Pipes <span style={{ fontStyle: 'italic', color: At.warm }}>Pvt. Ltd.</span>
          </h1>
          <p style={{
            fontFamily: 'IBM Plex Sans', fontWeight: 300, fontSize: 19,
            lineHeight: 1.55, color: At.mute, maxWidth: 540, marginTop: 24,
          }}>
            ERW and HFW welded steel tubes & line pipe to API 5L Gr.B, ASTM A106B,
            A53B and IS / BS / JIS standards. Used in oil & gas transmission, LPG
            cylinder fabrication, automotive, and structural applications.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            <button style={{
              background: At.warm, color: At.ink, border: 'none', padding: '16px 28px',
              fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 13,
              letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 12,
            }}>Download spec sheet <Icon name="download" size={14}/></button>
            <button style={{
              background: 'transparent', color: At.paper, border: `1px solid ${At.rule}`,
              padding: '16px 28px', fontFamily: 'IBM Plex Sans', fontWeight: 500, fontSize: 13,
              letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>Request quote</button>
          </div>
        </div>

        <Photo src={PHOTOS.pipeStack} ratio="4/5" label="ami pipes · plant 02 · khopoli" tone="dark"/>
      </div>
    </section>

    {/* Spec table */}
    <section style={{ background: At.paper, color: At.ink, padding: '96px 56px' }}>
      <div style={{ marginBottom: 56 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: At.warmDk, marginBottom: 16 }}>01 · Product range</div>
        <h2 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 56, lineHeight: 1, margin: 0, letterSpacing: '-0.03em' }}>What we manufacture.</h2>
      </div>

      <div style={{ border: `1px solid ${At.ruleLt}`, background: At.paper }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
          padding: '14px 24px', gap: 24,
          background: At.ink, color: At.paper,
          fontFamily: 'IBM Plex Mono', fontSize: 10,
          letterSpacing: '.18em', textTransform: 'uppercase',
        }}>
          <span>Product</span><span>Standard</span><span>OD (mm)</span><span>Wall (mm)</span><span>Length</span><span></span>
        </div>
        {[
          ['ERW line pipe',         'API 5L Gr.B',  '21 – 219',  '2.0 – 12.7',  '6 – 12 m'],
          ['HFW transmission pipe', 'API 5L X42-X65','219 – 610', '5.0 – 25.0',  '6 – 18 m'],
          ['ASTM A106 seamless',    'ASTM A106B',   '21 – 168',  '2.8 – 14.3',  '4 – 12 m'],
          ['Cold-rolled welded',    'IS 4923 YST',  '12 – 76',   '1.6 – 4.5',   '4 – 6 m'],
          ['Hollow structural',     'IS 4923 / EN 10210','25 – 200','1.6 – 8.0', '6 – 12 m'],
          ['Lancing pipes',         'IS 1239',      '21 – 76',   '2.0 – 5.4',   '4 – 8 m'],
        ].map((r, i) => (
          <div key={r[0]} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
            padding: '20px 24px', gap: 24, alignItems: 'center',
            borderTop: i > 0 ? `1px solid ${At.ruleLt}` : 'none',
          }}>
            <span style={{ fontFamily: 'IBM Plex Serif', fontWeight: 500, fontSize: 18, letterSpacing: '-0.01em' }}>{r[0]}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: At.warmDk }}>{r[1]}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r[2]}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r[3]}</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{r[4]}</span>
            <span style={{ textAlign: 'right' }}><Icon name="arrow" size={16}/></span>
          </div>
        ))}
      </div>
    </section>

    {/* Applications */}
    <section style={{ background: At.paper, color: At.ink, padding: '40px 56px 120px' }}>
      <div style={{ borderTop: `1px solid ${At.ruleLt}`, paddingTop: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 64 }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: At.warmDk, marginBottom: 16 }}>02 · Where it's used</div>
            <h2 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 300, fontSize: 48, lineHeight: 1.05, margin: 0, letterSpacing: '-0.025em' }}>Applications we ship into.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {[
              { t: 'Oil & gas transmission', d: 'Sour-service and standard line pipe with PSL2 testing.' },
              { t: 'LPG cylinder bodies', d: 'Deep-draw quality strip rolled and welded to IS 3196.' },
              { t: 'Automotive frames', d: 'CRW tubing for chassis, sub-frames and body-builders.' },
              { t: 'Structural & infra', d: 'EN 10210 hollow sections for buildings and bridges.' },
              { t: 'Steelmaking', d: 'Oxygen lancing pipes for primary and secondary metallurgy.' },
              { t: 'Furniture & fabrication', d: 'Smaller diameter welded tube, multiple finish options.' },
            ].map((a, i) => (
              <div key={a.t} style={{ padding: '20px 0', borderTop: i > 1 ? `1px solid ${At.ruleLt}` : 'none' }}>
                <h3 style={{ fontFamily: 'IBM Plex Serif', fontWeight: 500, fontSize: 22, margin: 0, marginBottom: 6, letterSpacing: '-0.01em' }}>{a.t}</h3>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, lineHeight: 1.55, color: At.muteLt, margin: 0 }}>{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <CtaFooterA_ref/>
  </div>
);

Object.assign(window, { AboutA, ContactA, SubCoA });
