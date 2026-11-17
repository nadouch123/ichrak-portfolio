// FlyRank AI Internship graduate badge (Week 9 "Plant Your Flag").
// Generated at internship-badge.netlify.app (card shape, light theme, with ID)
// and kept visually identical to the official badge. It links to the public
// verification page for this credential.
const CREDENTIAL_ID = 'FR-D1-T668H-R789R';
const NAME = 'Ichrak Matrouh';
const TRACK = 'Front-end AI Engineering';
const COHORT = 'July 2026 cohort';
export const VERIFY_URL = `https://internship.flyrank.ai/verify?id=${CREDENTIAL_ID}&first_name=${encodeURIComponent(NAME)}`;

// The generator resets every property inline so host-page CSS can't restyle the badge.
const reset = {
  margin: '0', padding: '0', border: '0', background: 'none', color: 'inherit', fontWeight: '400',
  fontStyle: 'normal', letterSpacing: 'normal', textTransform: 'none', textDecoration: 'none',
  whiteSpace: 'normal', float: 'none',
};
const mono = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
const muted = 'rgba(5,31,33,0.5)';
const ink = '#051F21';
const green = '#1A7A4A';
const svgStyle = { display: 'block', flex: 'none', opacity: '1', transform: 'none', maxWidth: 'none' };
const label = (fontSize, extra = {}) => ({ ...reset, color: muted, fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: mono, fontSize, ...extra });

export function FlyrankBadge() {
  return (
    <a
      href={VERIFY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Verify ${NAME}'s FlyRank AI Internship credential ${CREDENTIAL_ID}`}
      className="flyrank-badge"
      style={{
        boxSizing: 'border-box', margin: '0', padding: '22px', border: '1px solid #DDE4E7',
        background: '#FFFFFF', textDecoration: 'none',
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
        fontStyle: 'normal', lineHeight: '1.25', textTransform: 'none', float: 'none',
        WebkitFontSmoothing: 'antialiased', display: 'flex', flexDirection: 'column',
        width: '236px', maxWidth: '100%', borderRadius: '20px', boxShadow: '0 1px 2px rgba(5,31,33,0.05)',
      }}
    >
      <span style={{ ...reset, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="30" height="30" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style={svgStyle}>
          <rect width="96" height="96" rx="22" fill={ink} />
          <path d="M28.2354 74.2202V67.9039C29.6419 68.4369 31.3724 68.7055 33.4311 68.7055C35.3235 68.7055 36.8153 68.2396 37.8979 67.3079C38.9805 66.3762 39.9566 64.8695 40.8218 62.792L42.6887 58.3139L29.8976 29.2879C35.0038 29.2879 39.6028 32.3307 41.5294 36.9893L47.0746 50.3985L56.0126 28.6038C57.9221 23.9452 62.5168 20.894 67.6187 20.894L50.0795 63.5936C48.4556 67.5933 46.5205 70.5102 44.2743 72.3484C42.0281 74.1867 39.1169 75.1058 35.5451 75.1058C32.6212 75.1058 30.1875 74.812 28.2354 74.2244V74.2202Z" fill="#54E399" />
        </svg>
        <span style={label('8.5px', { lineHeight: '1.4' })}>FlyRank AI Internship</span>
      </span>
      <span style={{ ...reset, margin: '18px 0', background: '#E4EAED', display: 'block', height: '1px' }} />
      <span style={{ ...reset, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ ...reset, color: ink, fontWeight: '600', letterSpacing: '-0.02em', fontSize: '19px', lineHeight: '1.25' }}>{NAME}</span>
        <span style={{ ...reset, color: green, fontWeight: '600', fontSize: '13px' }}>{TRACK}</span>
        <span style={{ ...reset, color: muted, fontSize: '12px' }}>{COHORT}</span>
      </span>
      <span style={{ ...reset, padding: '10px 12px', border: '1px solid rgba(84,227,153,0.28)', background: 'rgba(84,227,153,0.12)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px', borderRadius: '12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style={svgStyle}>
          <circle cx="12" cy="12" r="10" stroke={green} strokeWidth="1.5" />
          <path d="M7.9 12.3l2.8 2.8 5.4-5.8" stroke={green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ ...reset, color: green, fontWeight: '600', fontSize: '12.5px' }}>Verified credential</span>
      </span>
      <span style={{ ...reset, display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #E4EAED' }}>
        <span style={label('8px')}>Credential ID</span>
        <span style={{ ...reset, color: ink, fontFamily: mono, fontSize: '11.5px' }}>{CREDENTIAL_ID}</span>
        <span style={{ ...reset, color: muted, fontSize: '11.5px', marginTop: '8px' }}>internship.flyrank.ai/verify ↗</span>
      </span>
    </a>
  );
}
