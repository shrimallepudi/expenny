'use client';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { C, FULL_MONTHS, SHORT_MONTHS } from '@/lib/constants';
import { upsertSheetTransactions, insertTransaction, deleteTransaction, saveUserSettings } from '@/lib/db';
import SheetListing from './SheetListing';
import SheetGrid    from './SheetGrid';
import BudgetPlanner from './BudgetPlanner';
import CalendarView  from './CalendarView';
import MasterSettings from './MasterSettings';

const TABS = ['Expenses', 'Budget', 'Calendar', 'Master'];
const today = new Date();
const CY = today.getFullYear();

export default function AppShell({ userId, userEmail, initialTransactions, initialExpenseCats, initialIncomeTypes }) {
  const [tab, setTab]               = useState('Expenses');
  const [transactions, setTx]       = useState(initialTransactions);
  const [expenseCats, setExpenseCats] = useState(initialExpenseCats);
  const [incomeTypes, setIncomeTypes] = useState(initialIncomeTypes);
  const [openSheet, setOpenSheet]   = useState(null); // null | {year,month}
  const [calYear, setCalYear]       = useState(CY);
  const [saving, setSaving]         = useState(false);
  const [saveErr, setSaveErr]       = useState('');

  const supabase = createClient();

  // ── Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ── Save sheet (upsert month's transactions)
  const saveSheet = useCallback(async (year, month, newTxList) => {
    setSaving(true); setSaveErr('');
    try {
      await upsertSheetTransactions(userId, year, month, newTxList);
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      setTx(prev => [...prev.filter(t => !t.date.startsWith(key)), ...newTxList]);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // ── Add single transaction (Budget)
  const addTx = useCallback(async (tx) => {
    setSaving(true); setSaveErr('');
    try {
      const saved = await insertTransaction(userId, tx);
      setTx(prev => [saved, ...prev]);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // ── Delete transaction
  const delTx = useCallback(async (id) => {
    try {
      await deleteTransaction(id);
      setTx(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setSaveErr(e.message);
    }
  }, []);

  // ── Save settings
  const persistSettings = useCallback(async (cats, types) => {
    try { await saveUserSettings(userId, cats, types); } catch {}
  }, [userId]);

  const handleSetExpenseCats = useCallback((v) => {
    const next = typeof v === 'function' ? v(expenseCats) : v;
    setExpenseCats(next);
    persistSettings(next, incomeTypes);
  }, [expenseCats, incomeTypes, persistSettings]);

  const handleSetIncomeTypes = useCallback((v) => {
    const next = typeof v === 'function' ? v(incomeTypes) : v;
    setIncomeTypes(next);
    persistSettings(expenseCats, next);
  }, [expenseCats, incomeTypes, persistSettings]);

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, color: C.textPrimary, fontFamily: "'Work Sans', sans-serif", fontSize: 14 }}>

      {/* ── Nav bar ── */}
      <div style={{ background: C.bgPanel, borderBottom: `1px solid ${C.border}`, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, zIndex: 200, boxShadow: C.shadow }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', marginRight: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>₹</div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>Expensa</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t} className="tab-item" onClick={() => { setTab(t); if (t !== 'Expenses') setOpenSheet(null); }} style={{
              padding: '0 16px', height: 48, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? C.textPrimary : C.textMuted,
              borderBottom: tab === t ? `2px solid ${C.textPrimary}` : '2px solid transparent',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>

        {/* Breadcrumb */}
        {tab === 'Expenses' && openSheet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, fontSize: 13 }}>
            <span style={{ color: C.border }}>·</span>
            <button onClick={() => setOpenSheet(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, fontFamily: 'inherit', fontSize: 13, textDecoration: 'underline', textDecorationColor: C.border }}>All Sheets</button>
            <span style={{ color: C.textMuted }}>›</span>
            <span style={{ color: C.textPrimary, fontWeight: 600 }}>{FULL_MONTHS[openSheet.month]} {openSheet.year}</span>
          </div>
        )}

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 11.5, color: C.yellow, background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, padding: '3px 10px', borderRadius: 99 }}>Saving…</span>}
          {saveErr && <span style={{ fontSize: 11.5, color: C.red, background: C.redLight, border: `1px solid ${C.redBorder}`, padding: '3px 10px', borderRadius: 99, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={saveErr}>Error: {saveErr}</span>}
          <span style={{ fontSize: 12, color: C.textMuted, background: C.bgPage, padding: '3px 9px', borderRadius: 99, border: `1px solid ${C.border}` }}>INR · ₹</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bgPage, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accentLight, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.accent }}>{userEmail[0].toUpperCase()}</div>
            <span style={{ fontSize: 12.5, color: C.textSecondary, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
          </div>
          <button onClick={handleSignOut} className="btn-ghost" style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 7, padding: '4px 11px', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ padding: '28px', maxWidth: 1440, margin: '0 auto' }}>
        {tab === 'Expenses' && (
          openSheet
            ? <SheetGrid year={openSheet.year} month={openSheet.month} transactions={transactions} saveSheet={saveSheet} onBack={() => setOpenSheet(null)} expenseCats={expenseCats} incomeTypes={incomeTypes} saving={saving} />
            : <SheetListing transactions={transactions} onOpen={(y, m) => setOpenSheet({ year: y, month: m })} />
        )}
        {tab === 'Budget'   && <BudgetPlanner transactions={transactions} addTx={addTx} delTx={delTx} expenseCats={expenseCats} incomeTypes={incomeTypes} />}
        {tab === 'Calendar' && <CalendarView year={calYear} setYear={setCalYear} transactions={transactions} />}
        {tab === 'Master'   && <MasterSettings expenseCats={expenseCats} setExpenseCats={handleSetExpenseCats} incomeTypes={incomeTypes} setIncomeTypes={handleSetIncomeTypes} />}
      </div>
    </div>
  );
}
