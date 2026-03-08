'use client';
import { useState, useMemo } from 'react';
import { C, EXPENSE_SECTIONS, CAT_COLORS, INC_COLORS } from '@/lib/constants';
import { iSt } from './ui';
import { toast } from 'react-hot-toast';

export default function MasterSettings({ expenseCats, setExpenseCats, incomeTypes, setIncomeTypes, activeWorkspace }) {
  const [activeTab, setActiveTab] = useState('expenses');
  const [search, setSearch] = useState('');

  const activeCatSet = useMemo(() => new Set(expenseCats), [expenseCats]);

  const toggleCat = (name) => {
    setExpenseCats(prev =>
      prev.includes(name)
        ? (prev.length > 1 ? prev.filter(x => x !== name) : prev)
        : [...prev, name]
    );
  };

  const filteredSections = useMemo(() => {
    if (!search.trim()) return EXPENSE_SECTIONS;
    const q = search.toLowerCase();
    return EXPENSE_SECTIONS
      .map(sec => ({ ...sec, items: sec.items.filter(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)) }))
      .filter(sec => sec.items.length > 0);
  }, [search]);

  const totalActive = expenseCats.length;
  const totalAll = EXPENSE_SECTIONS.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>Master Settings</h1>
        <p style={{ color: C.textMuted, fontSize: 13.5, marginTop: 5 }}>Configure expense categories and income types used across the app</p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        {[
          ['expenses', 'Expense Categories'], 
          ['income', 'Income Types']
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: activeTab === key ? 600 : 400,
            color: activeTab === key ? C.textPrimary : C.textMuted,
            borderBottom: activeTab === key ? `2px solid ${C.textPrimary}` : '2px solid transparent',
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                <span style={{ fontWeight: 600, color: C.textPrimary }}>{totalActive}</span> of {totalAll} categories active
              </span>
              <span style={{ fontSize: 11, color: C.textMuted, background: C.bgPage, border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: 99 }}>
                {EXPENSE_SECTIONS.length} sections
              </span>
            </div>
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, fontSize: 14, pointerEvents: 'none' }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
                style={{ ...iSt(), paddingLeft: 30, width: 220, fontSize: 13 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredSections.map(sec => (
              <div key={sec.section} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '11px 18px', background: C.bgPage, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color.dot, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{sec.section}</span>
                  <span style={{ fontSize: 11.5, color: C.textMuted, marginLeft: 2 }}>
                    ({sec.items.filter(i => activeCatSet.has(i.name)).length}/{sec.items.length} active)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))' }}>
                  {sec.items.map(item => {
                    const isActive = activeCatSet.has(item.name);
                    return (
                      <div key={item.name} onClick={() => toggleCat(item.name)} className="row-hover"
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 16px', cursor: 'pointer', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: isActive ? 'transparent' : `${C.bgPage}88`, opacity: isActive ? 1 : 0.55, transition: 'opacity .15s' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, marginTop: 1, flexShrink: 0, border: `1.5px solid ${isActive ? sec.color.dot : C.borderMid}`, background: isActive ? sec.color.dot : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                          {isActive && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{item.name}</div>
                          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom category */}
          <div style={{ marginTop: 16, background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, boxShadow: C.shadow }}>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Add Custom Category</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="e.g. Pet Care, Hobby Supplies..."
                onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { setExpenseCats(c => { const val = e.target.value.trim(); if(c.includes(val)) { toast.error('Category already exists', { style: { background: '#ef4444', color: '#fff' }}); return c; } return [...c, val]; }); e.target.value = ''; } }}
                style={{ ...iSt(), flex: 1 }} />
              <button onClick={e => { const inp = e.target.previousSibling; if (inp.value.trim()) { setExpenseCats(c => { const val = inp.value.trim(); if(c.includes(val)){ toast.error('Category already exists', { style: { background: '#ef4444', color: '#fff' }}); return c; } return [...c, val];}); inp.value = ''; } }}
                className="btn-primary" style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '0 18px', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit' }}>Add</button>
            </div>
            {expenseCats.filter(c => !CAT_COLORS[c]).length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {expenseCats.filter(c => !CAT_COLORS[c]).map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.bgPage, border: `1px solid ${C.border}`, borderRadius: 7, padding: '4px 10px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.textMuted, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: C.textSecondary }}>{c}</span>
                    <button onClick={() => { setExpenseCats(prev => prev.filter(x => x !== c)); }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div>
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
            <div style={{ padding: '11px 18px', background: C.bgPage, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>Income Types</span>
              <span style={{ fontSize: 12.5, color: C.textMuted, marginLeft: 8 }}>({incomeTypes.length} configured)</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input placeholder="Add income type..."
                  onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { setIncomeTypes(c => { const val = e.target.value.trim(); if(c.includes(val)) { toast.error('Income type already exists', { style: { background: '#ef4444', color: '#fff' }}); return c; } return [...c, val]; }); e.target.value = ''; } }}
                  style={{ ...iSt(), flex: 1 }} />
                <button onClick={e => { const inp = e.target.previousSibling; if (inp.value.trim()) { setIncomeTypes(c => { const val = inp.value.trim(); if(c.includes(val)) { toast.error('Income type already exists', { style: { background: '#ef4444', color: '#fff' }}); return c; } return [...c, val]; }); inp.value = ''; } }}
                  className="btn-primary" style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '0 18px', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit' }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {incomeTypes.map(inc => {
                  const col = INC_COLORS[inc] || { dot: '#9b9890', bg: '#f2f1ee', border: '#cccab8' };
                  return (
                    <div key={inc} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13.5 }}>{inc}</span>
                      {incomeTypes.length > 1 && (
                        <button onClick={() => setIncomeTypes(c => c.filter(x => x !== inc))}
                          style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer', fontSize: 12, borderRadius: 6, padding: '2px 8px', fontFamily: 'inherit' }}>Remove</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, background: C.accentLight, border: `1px solid ${C.accentBorder}`, borderRadius: 10, padding: 16 }}>
        <p style={{ fontWeight: 600, color: C.accent, marginBottom: 6, fontSize: 14 }}>About categories</p>
        <p style={{ color: C.textSecondary, fontSize: 13.5, lineHeight: 1.8 }}>
          Check or uncheck categories to control which rows appear in your monthly expense sheets.
          All {totalAll} categories from the master list are available — only active ones show in the grid.
          Changes are saved to your workspace automatically.
        </p>
      </div>
    </div>
  );
}
