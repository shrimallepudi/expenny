'use client';
import { useState, useMemo } from 'react';
import { C, FULL_MONTHS, SHORT_MONTHS, getColor, fmt, padZ } from '@/lib/constants';
import { StatCard, YearNav } from './ui';

const today = new Date();
const CY = today.getFullYear(), CM = today.getMonth();

export default function SheetListing({ transactions, onOpen }) {
  const [year, setYear] = useState(CY);

  const summaries = useMemo(() => FULL_MONTHS.map((name, mi) => {
    const key  = `${year}-${padZ(mi + 1)}`;
    const txs  = transactions.filter(t => t.date.startsWith(key));
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const cats    = [...new Set(txs.filter(t => t.type === 'expense').map(t => t.category))];
    return { name, month: mi, income, expense, balance: income - expense, entries: txs.length, cats };
  }), [transactions, year]);

  const totalIncome  = summaries.reduce((s, m) => s + m.income, 0);
  const totalExpense = summaries.reduce((s, m) => s + m.expense, 0);

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>Expense Sheets</h1>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginTop: 5 }}>Monthly records — click any row to open</p>
        </div>
        <YearNav year={year} setYear={setYear} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Annual Income"   value={fmt(totalIncome)}            color="green" />
        <StatCard label="Annual Expenses" value={fmt(totalExpense)}           color="red" />
        <StatCard label="Net Balance"     value={fmt(totalIncome - totalExpense)} color={totalIncome >= totalExpense ? 'green' : 'red'} />
      </div>

      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 150px 150px 150px 90px 1fr 36px', padding: '10px 20px', borderBottom: `2px solid ${C.border}`, background: C.bgPage }}>
          {['Month', 'Income', 'Expenses', 'Balance', 'Entries', 'Categories', ''].map(h => (
            <div key={h} style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</div>
          ))}
        </div>

        {summaries.map((s, i) => {
          const isNow   = s.month === CM && year === CY;
          const barPct  = s.income > 0 ? Math.min(100, (s.expense / s.income) * 100) : (s.expense > 0 ? 100 : 0);
          const barColor = barPct >= 100 ? C.red : barPct > 80 ? C.yellow : C.green;
          return (
            <div key={s.name} className="listing-row" onClick={() => onOpen(year, s.month)}
              style={{ display: 'grid', gridTemplateColumns: '200px 150px 150px 150px 90px 1fr 36px', padding: '13px 20px', borderBottom: i < 11 ? `1px solid ${C.border}` : 'none', background: isNow ? C.accentLight : 'transparent', alignItems: 'center' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isNow ? C.accent : 'transparent', flexShrink: 0, display: 'block' }} />
                <span style={{ fontWeight: isNow ? 600 : 400, color: isNow ? C.accent : C.textPrimary, fontSize: 14 }}>{s.name}</span>
                {isNow && <span style={{ fontSize: 10.5, color: C.accent, background: C.accentLight, border: `1px solid ${C.accentBorder}`, padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>Current</span>}
              </div>

              <div style={{ fontSize: 13.5, color: s.income > 0 ? C.green : C.textDisabled, fontWeight: s.income > 0 ? 500 : 400 }}>
                {s.income > 0 ? fmt(s.income) : '—'}
              </div>

              <div>
                <div style={{ fontSize: 13.5, color: s.expense > 0 ? C.red : C.textDisabled, fontWeight: s.expense > 0 ? 500 : 400, marginBottom: s.expense > 0 ? 5 : 0 }}>
                  {s.expense > 0 ? fmt(s.expense) : '—'}
                </div>
                {s.expense > 0 && (
                  <div style={{ height: 2, background: C.border, borderRadius: 99, width: 80 }}>
                    <div style={{ height: '100%', borderRadius: 99, background: barColor, width: `${barPct}%` }} />
                  </div>
                )}
              </div>

              <div style={{ fontSize: 13.5, fontWeight: s.entries > 0 ? 600 : 400, color: s.entries > 0 ? (s.balance >= 0 ? C.green : C.red) : C.textDisabled }}>
                {s.entries > 0 ? (s.balance >= 0 ? '+' : '') + fmt(s.balance) : '—'}
              </div>

              <div style={{ fontSize: 13, color: s.entries > 0 ? C.textSecondary : C.textDisabled }}>{s.entries > 0 ? s.entries : '—'}</div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {s.cats.slice(0, 3).map(cat => (
                  <span key={cat} className="chip" style={{ background: getColor(cat, 'bg'), color: getColor(cat, 'dot'), border: `1px solid ${getColor(cat, 'border')}` }}>{cat}</span>
                ))}
                {s.cats.length > 3 && <span style={{ fontSize: 11.5, color: C.textMuted }}>+{s.cats.length - 3}</span>}
                {s.entries === 0 && <span style={{ fontSize: 12.5, color: C.textMuted, fontStyle: 'italic' }}>No entries yet</span>}
              </div>

              <div className="listing-arrow" style={{ opacity: 0, color: C.textMuted, fontSize: 16, textAlign: 'right' }}>›</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
