'use client';
import { useState, useMemo } from 'react';
import { C, FULL_MONTHS, SHORT_MONTHS, getColor, fmt, padZ } from '@/lib/constants';
import { StatCard, YearNav } from './ui';

const today = new Date();
const CY = today.getFullYear(), CM = today.getMonth();

export default function CalendarView({ year, setYear, transactions }) {
  const [selected, setSelected] = useState(null);

  const ms = useMemo(() => FULL_MONTHS.map((_, mi) => {
    const key = `${year}-${padZ(mi + 1)}`;
    const txs = transactions.filter(t => t.date.startsWith(key));
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense, count: txs.length };
  }), [transactions, year]);

  const aInc = ms.reduce((s, m) => s + m.income, 0);
  const aExp = ms.reduce((s, m) => s + m.expense, 0);

  const sTxs = selected
    ? transactions.filter(t => t.date.startsWith(`${selected.year}-${padZ(selected.month + 1)}`))
    : [];

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>Calendar View</h1>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginTop: 5 }}>Year at a glance — click any month for details</p>
        </div>
        <YearNav year={year} setYear={setYear} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Annual Income"   value={fmt(aInc)}       color="green" />
        <StatCard label="Annual Expenses" value={fmt(aExp)}       color="red" />
        <StatCard label="Annual Balance"  value={fmt(aInc - aExp)} color={aInc >= aExp ? 'green' : 'red'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {SHORT_MONTHS.map((m, i) => {
          const s = ms[i];
          const isSel = selected && selected.month === i && selected.year === year;
          const isNow = CM === i && CY === year;
          const bar = s.income > 0 ? Math.min(100, (s.expense / s.income) * 100) : (s.expense > 0 ? 100 : 0);
          const barColor = bar >= 100 ? C.red : bar > 80 ? C.yellow : C.green;
          return (
            <div key={m} className="month-card" onClick={() => setSelected(isSel ? null : { year, month: i })}
              style={{ background: isSel ? C.accentLight : C.bgPanel, border: `1px solid ${isSel ? C.accentBorder : C.border}`, borderRadius: 10, padding: 16, boxShadow: isSel ? C.shadowMd : C.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14.5, color: isNow ? C.accent : C.textPrimary }}>
                  {m}{isNow && <span style={{ fontSize: 9, color: C.accent, marginLeft: 4 }}>●</span>}
                </span>
                {s.count > 0 && <span style={{ fontSize: 11.5, color: C.textMuted, background: C.bgPage, padding: '1px 7px', borderRadius: 99, border: `1px solid ${C.border}` }}>{s.count}</span>}
              </div>
              {s.count > 0 ? <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: C.green }}>+{fmt(s.income)}</span>
                  <span style={{ fontSize: 11.5, color: C.red }}>−{fmt(s.expense)}</span>
                </div>
                <div style={{ height: 3, background: C.border, borderRadius: 99 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: barColor, width: `${bar}%`, transition: 'width .4s' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: s.balance >= 0 ? C.green : C.red }}>
                  {s.balance >= 0 ? '+' : ''}{fmt(s.balance)}
                </div>
              </> : <div style={{ color: C.textDisabled, fontSize: 12.5, marginTop: 4 }}>No entries</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fade-up" style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>
            {FULL_MONTHS[selected.month]} {selected.year}
          </div>
          {sTxs.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: C.textMuted }}>No entries this month.</div>}
          {sTxs.sort((a, b) => a.date.localeCompare(b.date)).map(tx => (
            <div key={tx.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: getColor(tx.category, 'dot'), marginRight: 12, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.textMuted, width: 72, flexShrink: 0 }}>
                {tx.date.slice(8)} {SHORT_MONTHS[new Date(tx.date + 'T00:00:00').getMonth()]}
              </span>
              <span style={{ flex: 1, fontSize: 13.5 }}>{tx.category}{tx.note ? <span style={{ color: C.textMuted }}> — {tx.note}</span> : null}</span>
              <span style={{ fontWeight: 600, color: tx.type === 'income' ? C.green : C.textPrimary, fontSize: 13.5 }}>
                {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
