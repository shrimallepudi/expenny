import { C } from '@/lib/constants';

export function StatCard({ label, value, color }) {
  const cfg = {
    green: { bg: C.greenLight, border: C.greenBorder, val: C.green },
    red:   { bg: C.redLight,   border: C.redBorder,   val: C.red },
  }[color] || { bg: C.bgPage, border: C.border, val: C.textPrimary };
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '16px 18px', boxShadow: C.shadow }}>
      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: cfg.val, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export function YearNav({ year, setYear }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', boxShadow: C.shadow }}>
      <button onClick={() => setYear(y => y - 1)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: '0 2px' }}>‹</button>
      <span style={{ fontWeight: 600, fontSize: 15, minWidth: 48, textAlign: 'center', color: C.textPrimary }}>{year}</span>
      <button onClick={() => setYear(y => y + 1)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: '0 2px' }}>›</button>
    </div>
  );
}

export function Field({ label, children, span }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <div style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

export const iSt = () => ({
  width: '100%', background: C.bgPage, border: `1px solid ${C.border}`,
  borderRadius: 7, padding: '8px 11px', color: C.textPrimary,
  fontSize: 13.5, outline: 'none', transition: 'border-color .15s',
});

export const sSt = () => ({
  width: '100%', background: C.bgPage, border: `1px solid ${C.border}`,
  borderRadius: 7, padding: '8px 11px', color: C.textPrimary,
  fontSize: 13.5, outline: 'none', cursor: 'pointer',
});

export const btnPrimary = (extra = {}) => ({
  background: C.accent, border: 'none', color: '#fff',
  borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
  fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
  whiteSpace: 'nowrap', boxShadow: C.shadow, ...extra,
});

export const btnGhost = (extra = {}) => ({
  background: 'none', border: `1px solid ${C.border}`, color: C.textSecondary,
  borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
  fontSize: 13.5, fontFamily: 'inherit', ...extra,
});
