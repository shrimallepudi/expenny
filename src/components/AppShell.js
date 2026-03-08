'use client';
import { useState, useCallback, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { C, FULL_MONTHS, SHORT_MONTHS } from '@/lib/constants';
import { upsertSheetTransactions, insertTransaction, deleteTransaction, saveWorkspaceSettings, fetchTransactions, fetchWorkspaceSettings } from '@/lib/db';
import SheetListing from './SheetListing';
import SheetGrid from './SheetGrid';
import BudgetPlanner from './BudgetPlanner';
import CalendarView from './CalendarView';
import MasterSettings from './MasterSettings';
import ReportsView from './ReportsView';
import ActivityView from './ActivityView';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';
import { Toaster, toast } from 'react-hot-toast';

const TABS = ['Expenses', 'Budget', 'Calendar', 'Master', 'Activity', 'Reports'];
const today = new Date();
const CY = today.getFullYear();

export default function AppShell({ userEmail, workspaces, initialWorkspace, initialTransactions, initialExpenseCats, initialIncomeTypes }) {
  const [activeWorkspace, setActiveWorkspace] = useState(initialWorkspace);
  const [tab, setTab] = useState('Expenses');
  const [transactions, setTx] = useState(initialTransactions);
  const [expenseCats, setExpenseCats] = useState(initialExpenseCats);
  const [incomeTypes, setIncomeTypes] = useState(initialIncomeTypes);
  const [openSheet, setOpenSheet] = useState(null); // null | {year,month}
  const [calYear, setCalYear] = useState(CY);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [isPending, startTransition] = useTransition();
  const [targetTab, setTargetTab] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);

  const supabase = createClient();

  // ── Sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    toast('Signing out...', { icon: '👋', style: { background: '#1f2937', color: '#fff' } });
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleTabChange = (t) => {
    setTargetTab(t);
    startTransition(() => {
      setTab(t);
      if (t !== 'Expenses') setOpenSheet(null);
    });
  };

  if (!activeWorkspace) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgPage }}>
        <div className="spinner" />
      </div>
    );
  }

  // ── Switch Workspace
  const handleWorkspaceChange = async (wsId) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (!ws) return;
    setActiveWorkspace(ws);
        
    startTransition(async () => {
      setOpenSheet(null);
      setTab('Expenses');
      
      try {
        const [newTx, newSettings] = await Promise.all([
          fetchTransactions(ws.id),
          fetchWorkspaceSettings(ws.id)
        ]);
        setTx(newTx);
        if (newSettings) {
          setExpenseCats(newSettings.expense_cats);
          setIncomeTypes(newSettings.income_types);
        } else {
          // If no settings exist yet for this workspace, fallback to current or defaults
          // (Usually handled on creation)
        }
      } catch (err) {
        toast.error('Failed to load workspace data');
      }
    });
  };

  // ── Save sheet (upsert month's transactions)
  const saveSheet = useCallback(async (year, month, newTxList) => {
    setSaving(true); setSaveErr('');
    try {
      await upsertSheetTransactions(activeWorkspace.id, year, month, newTxList);
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      setTx(prev => [...prev.filter(t => !t.date.startsWith(key)), ...newTxList]);
      toast.success(`Expenses updated for ${FULL_MONTHS[month]} ${year}`, { style: { background: '#10b981', color: '#fff' } });
    } catch (e) {
      setSaveErr(e.message);
      toast.error(e.message, { style: { background: '#ef4444', color: '#fff' } });
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace.id]);

  // ── Add single transaction (Budget)
  const addTx = useCallback(async (tx) => {
    setSaving(true); setSaveErr('');
    try {
      const saved = await insertTransaction(activeWorkspace.id, tx);
      setTx(prev => [saved, ...prev]);
      toast.success('Transaction added', { style: { background: '#10b981', color: '#fff' } });
    } catch (e) {
      setSaveErr(e.message);
      toast.error(e.message, { style: { background: '#ef4444', color: '#fff' } });
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace?.id]);

  // ── Delete transaction
  const delTx = useCallback(async (id) => {
    try {
      await deleteTransaction(id);
      setTx(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted', { style: { background: '#10b981', color: '#fff' } });
    } catch (e) {
      setSaveErr(e.message);
      toast.error(e.message, { style: { background: '#ef4444', color: '#fff' } });
    }
  }, []);

  // ── Save settings
  const persistSettings = useCallback(async (cats, types, silent = false) => {
    try {
      await saveWorkspaceSettings(activeWorkspace.id, cats, types);
      if (!silent) toast.success('Settings updated', { style: { background: '#10b981', color: '#fff' } });
    } catch (e) {
      toast.error(e.message, { style: { background: '#ef4444', color: '#fff' } });
    }
  }, [activeWorkspace.id]);

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
      <Toaster position="bottom-right" />
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
            <button key={t} className="tab-item" onClick={() => handleTabChange(t)} style={{
              padding: '0 16px', height: 48, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? C.textPrimary : C.textMuted,
              borderBottom: tab === t ? `2px solid ${C.textPrimary}` : '2px solid transparent',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {isPending && targetTab === t && <div className="spinner" style={{ width: 14, height: 14, borderTopColor: C.textPrimary, borderWidth: 1.5 }} />}
              {t}
            </button>
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
          {/* Workspace Switcher */}
          <select 
            value={activeWorkspace?.id} 
            onChange={e => handleWorkspaceChange(e.target.value)}
            style={{ 
              background: C.bgPage, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', 
              fontSize: 12.5, color: C.textPrimary, fontWeight: 500, outline: 'none', cursor: 'pointer' 
            }}
          >
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
            ))}
          </select>
          
          <div style={{ width: 1, height: 16, background: C.border, margin: '0 4px' }} />

          {saving && <span style={{ fontSize: 11.5, color: C.yellow, background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, padding: '3px 10px', borderRadius: 99 }}>Saving…</span>}
          {saveErr && <span style={{ fontSize: 11.5, color: C.red, background: C.redLight, border: `1px solid ${C.redBorder}`, padding: '3px 10px', borderRadius: 99, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={saveErr}>Error: {saveErr}</span>}
          <span style={{ fontSize: 12, color: C.textMuted, background: C.bgPage, padding: '3px 9px', borderRadius: 99, border: `1px solid ${C.border}` }}>INR · ₹</span>
          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: profileOpen ? C.accentLight : C.bgPage, border: `1px solid ${profileOpen ? C.accent : C.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accentLight, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.accent }}>{userEmail[0].toUpperCase()}</div>
              <span style={{ fontSize: 13, color: profileOpen ? C.accent : C.textSecondary, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: profileOpen ? 600 : 500 }}>{userEmail.split('@')[0]}</span>
              <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 2 }}>{profileOpen ? '▲' : '▼'}</span>
            </button>

            {profileOpen && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={() => setProfileOpen(false)} />
                <div className="fade-up" style={{ position: 'absolute', top: 38, right: 0, width: 200, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.bgPage }}>
                    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Signed in as</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
                  </div>
                  
                  <div style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
                    <button 
                      onClick={() => { setWsModalOpen(true); setProfileOpen(false); }}
                      className="row-hover"
                      style={{ background: 'none', border: 'none', padding: '10px 12px', fontSize: 13, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6, color: C.textPrimary }}
                    >
                      <span style={{ fontSize: 15 }}>⚙️</span> Workspace Settings
                    </button>
                    
                    <button 
                      onClick={handleSignOut} 
                      disabled={isSigningOut} 
                      className="row-hover"
                      style={{ background: 'none', border: 'none', padding: '10px 12px', fontSize: 13, textAlign: 'left', cursor: isSigningOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6, color: C.red }}
                    >
                      {isSigningOut ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: C.red, borderWidth: 1.5 }} /> : <span style={{ fontSize: 15 }}>🚪</span>}
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ padding: '28px', maxWidth: 1440, margin: '0 auto' }}>
        {tab === 'Expenses' && (
          openSheet
            ? <SheetGrid year={openSheet.year} month={openSheet.month} transactions={transactions} saveSheet={saveSheet} onBack={() => setOpenSheet(null)} expenseCats={expenseCats} incomeTypes={incomeTypes} saving={saving} />
            : <SheetListing transactions={transactions} onOpen={(y, m) => setOpenSheet({ year: y, month: m })} />
        )}
        {tab === 'Budget' && <BudgetPlanner transactions={transactions} addTx={addTx} delTx={delTx} expenseCats={expenseCats} incomeTypes={incomeTypes} />}
        {tab === 'Activity' && <ActivityView workspace={activeWorkspace} />}
        {tab === 'Reports' && <ReportsView transactions={transactions} expenseCats={expenseCats} incomeTypes={incomeTypes} />}
        {tab === 'Calendar' && <CalendarView year={calYear} setYear={setCalYear} transactions={transactions} />}
        {tab === 'Master' && <MasterSettings expenseCats={expenseCats} setExpenseCats={handleSetExpenseCats} incomeTypes={incomeTypes} setIncomeTypes={handleSetIncomeTypes} activeWorkspace={activeWorkspace} />}
      </div>

      {/* ── Workspace Settings Modal ── */}
      {wsModalOpen && (
        <WorkspaceSettingsModal 
          workspace={activeWorkspace} 
          onClose={() => setWsModalOpen(false)} 
        />
      )}
    </div>
  );
}
