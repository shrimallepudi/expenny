'use client';
import { useState, useMemo } from 'react';
import { C, FULL_MONTHS, SHORT_MONTHS, getColor, fmt, padZ } from '@/lib/constants';
import { StatCard, Field, iSt, sSt } from './ui';

const today = new Date();
const CY = today.getFullYear(), CM = today.getMonth();

export default function BudgetPlanner({ transactions, addTx, delTx, expenseCats, incomeTypes }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: '', type: 'expense', category: expenseCats[0], amount: '', note: '', recurring: false, recurringFreq: 'monthly' });
  const [vMonth, setVMonth] = useState(CM);
  const [vYear,  setVYear]  = useState(CY);
  const [loading, setLoading] = useState(false);

  const monthKey = `${vYear}-${padZ(vMonth + 1)}`;
  const mb   = transactions.filter(t => t.date.startsWith(monthKey));
  const bInc = mb.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const bExp = mb.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const handleSubmit = async () => {
    if (!form.date || !form.amount || isNaN(form.amount)) return;
    setLoading(true);
    await addTx(form);
    setForm({ date: '', type: 'expense', category: expenseCats[0], amount: '', note: '', recurring: false, recurringFreq: 'monthly' });
    setShowAdd(false);
    setLoading(false);
  };

  const upcoming = useMemo(() => {
    const now = new Date(); const map = {};
    transactions.filter(t => new Date(t.date + 'T00:00:00') >= now).forEach(t => {
      const k = t.date.substring(0, 7);
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    return Object.entries(map).sort();
  }, [transactions]);

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>Budget Planner</h1>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginTop: 5 }}>Plan future income &amp; expenses</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary"
          style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit' }}>
          + Add Entry
        </button>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 13, color: C.textMuted }}>Viewing</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px' }}>
          <button onClick={() => { let m = vMonth - 1, y = vYear; if (m < 0) { m = 11; y--; } setVMonth(m); setVYear(y); }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 16 }}>‹</button>
          <span style={{ fontWeight: 600, minWidth: 130, textAlign: 'center', fontSize: 14 }}>{FULL_MONTHS[vMonth]} {vYear}</span>
          <button onClick={() => { let m = vMonth + 1, y = vYear; if (m > 11) { m = 0; y++; } setVMonth(m); setVYear(y); }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 16 }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Budgeted Income"   value={fmt(bInc)}       color="green" />
        <StatCard label="Budgeted Expenses" value={fmt(bExp)}       color="red" />
        <StatCard label="Projected Balance" value={fmt(bInc - bExp)} color={bInc >= bExp ? 'green' : 'red'} />
      </div>

      {showAdd && (
        <div className="fade-up" style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>New Budget Entry</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 12 }}>
            <Field label="Date"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={iSt()} /></Field>
            <Field label="Type">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category: e.target.value === 'expense' ? expenseCats[0] : incomeTypes[0] }))} style={sSt()}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={sSt()}>
                {(form.type === 'expense' ? expenseCats : incomeTypes).map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (₹)"><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={iSt()} /></Field>
            <Field label="Note" span={2}><input type="text" placeholder="Optional note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={iSt()} /></Field>
            <Field label="Recurring">
              <select value={form.recurring ? form.recurringFreq : 'no'} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, recurring: v !== 'no', recurringFreq: v !== 'no' ? v : 'monthly' })); }} style={sSt()}>
                <option value="no">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary"
              style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : 'Add Entry'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost"
              style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSecondary, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 14 }}>Upcoming Entries</div>
        {upcoming.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 13.5 }}>No upcoming entries. Add one above.</div>}
        {upcoming.map(([mk, txs]) => {
          const [y, m] = mk.split('-').map(Number);
          const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          return (
            <div key={mk}>
              <div style={{ padding: '8px 20px', background: C.bgPage, display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{FULL_MONTHS[m - 1]} {y}</span>
                <span style={{ color: C.green, fontSize: 12.5 }}>+{fmt(inc)}</span>
                <span style={{ color: C.red, fontSize: 12.5 }}>−{fmt(exp)}</span>
                <span style={{ color: inc >= exp ? C.green : C.red, fontWeight: 700, fontSize: 13, marginLeft: 'auto' }}>= {fmt(inc - exp)}</span>
              </div>
              {txs.map(tx => (
                <div key={tx.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: getColor(tx.category, 'dot'), marginRight: 12, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5 }}>{tx.category}{tx.note ? <span style={{ color: C.textMuted }}> — {tx.note}</span> : null}</span>
                  <span style={{ fontSize: 12.5, color: C.textMuted, marginRight: 20 }}>{tx.date}</span>
                  <span style={{ fontWeight: 600, color: tx.type === 'income' ? C.green : C.textPrimary, fontSize: 13.5 }}>{tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}</span>
                  <button onClick={() => delTx(tx.id)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 6, padding: '2px 8px', marginLeft: 12, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>✕</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
