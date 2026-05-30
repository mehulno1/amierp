import logo from '../assets/logoami.png'

// Shared header strip used by Offer/PI/PO documents. Mirrors the exact wording and
// layout of the legacy PDFs the customer hands to clients (see requirements/Dina Iron
// PI.pdf and requirements/abhjeet _ offer.pdf). Brand-specific overrides come from
// the brand record; when those are absent we fall back to the AEPL master copy.
interface Props {
  brandName?: string
  brandAddress?: string
  brandPhone?: string
  brandEmail?: string
  brandGstin?: string
}

export default function DocumentHeader({ brandName, brandAddress, brandPhone, brandEmail, brandGstin }: Props) {
  const name = brandName || 'AMI ENTERPRISES PVT. LTD.'
  const address = brandAddress || 'PLOT NO: 64-71, VILL- KAMALPUR POST- KOLABIRA, SERAIKELA - KHARSAWAN 833220'
  const phone = brandPhone || '94313-00011 / 8797363639'
  const email = brandEmail || 'info@amiglobal.in / aepl@amiglobal.in'

  return (
    <div className="doc-header" style={{ borderBottom: '2px solid #1f2937', paddingBottom: '12px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={logo} alt="Ami" crossOrigin="anonymous" style={{ width: '72px', height: '72px', objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af', letterSpacing: '0.02em' }}>{name}</div>
          <div style={{ fontSize: '11px', color: '#1f2937', marginTop: '4px', whiteSpace: 'pre-line' }}>{address}</div>
          <div style={{ fontSize: '11px', color: '#1f2937' }}>PHONE : {phone}</div>
          <div style={{ fontSize: '11px', color: '#1f2937' }}>Email : {email}</div>
          {brandGstin && <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>GSTIN: {brandGstin}</div>}
        </div>
        {/* spacer to keep the name visually centred against the logo on the left */}
        <div style={{ width: '72px', flexShrink: 0 }} />
      </div>
    </div>
  )
}
