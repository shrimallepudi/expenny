'use client';
import { useState, useMemo } from 'react';
import { C, EXPENSE_SECTIONS, CAT_COLORS, INC_COLORS } from '@/lib/constants';
import { iSt } from './ui';
import { toast } from 'react-hot-toast';

export default function MasterSettings({ 
  expenseCats, setExpenseCats, 
  incomeTypes, setIncomeTypes, 
  customCats = [], setCustomCats,
  activeWorkspace 
}) {
  const [activeTab, setActiveTab] = useState('expenses');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null); // { type: 'expense'|'income', section?, item?, isNew: bool }

  const activeExpenseSet = useMemo(() => new Set(expenseCats), [expenseCats]);
  const activeIncomeSet = useMemo(() => new Set(incomeTypes), [incomeTypes]);

  // Merge hardcoded sections with custom categories
  const effectiveSections = useMemo(() => {
    const sections = EXPENSE_SECTIONS.map(sec => {
      // Start with hardcoded items
      let items = [...sec.items];

      // Apply overrides/edits from customCats
      items = items.map(item => {
        const custom = customCats.find(c => c.type === 'expense' && c.section === sec.section && c.originalName === item.name);
        if (custom) return { ...item, name: custom.name, desc: custom.desc, isEdited: true, originalName: custom.originalName };
        return item;
      });

      // Add new items for this section
      const additions = customCats.filter(c => c.type === 'expense' && c.section === sec.section && !c.originalName);
      items = [...items, ...additions];

      // Filter by search
      if (search.trim()) {
        const q = search.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
      }

      return { ...sec, items };
    }).filter(sec => sec.items.length > 0 || !search.trim());

    return sections;
  }, [customCats, search]);

  const effectiveIncomes = useMemo(() => {
    // Start with hardcoded keys
    let items = Object.keys(INC_COLORS).map(name => ({ name }));

    // Apply overrides
    items = items.map(item => {
      const custom = customCats.find(c => c.type === 'income' && c.originalName === item.name);
      if (custom) return { ...item, name: custom.name, isEdited: true, originalName: custom.originalName };
      return item;
    });

    // Add new ones
    const additions = customCats.filter(c => c.type === 'income' && !c.originalName);
    items = [...items, ...additions];

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }

    return items;
  }, [customCats, search]);

  const toggleExpense = (name) => {
    setExpenseCats(prev =>
      prev.includes(name)
        ? (prev.length > 1 ? prev.filter(x => x !== name) : prev)
        : [...prev, name]
    );
  };

  const toggleIncome = (name) => {
    setIncomeTypes(prev =>
      prev.includes(name)
        ? (prev.length > 1 ? prev.filter(x => x !== name) : prev)
        : [...prev, name]
    );
  };

  const handleSaveItem = (data) => {
    const { type, section, name, desc, isNew, originalName } = data;
    
    if (!name.trim()) return toast.error('Name is required');

    setCustomCats(prev => {
      let next = [...prev];
      if (isNew) {
        // Check for duplicates
        const exists = (type === 'expense' ? effectiveSections.flatMap(s => s.items) : effectiveIncomes).some(i => i.name === name);
        if (exists) { 
          toast.error('Category name already exists');
          return prev;
        }
        next.push({ type, section, name, desc });
      } else {
        // Update existing custom or hardcoded override
        const idx = prev.findIndex(c => c.type === type && (c.name === name || c.originalName === originalName));
        if (idx > -1) {
          next[idx] = { ...next[idx], name, desc };
        } else {
          // It was a hardcoded item being edited for the first time
          next.push({ type, section, name, desc, originalName });
        }
      }
      return next;
    });

    // If edited, update the active set if the name changed
    if (!isNew && originalName && originalName !== name) {
      if (type === 'expense') {
        setExpenseCats(prev => prev.map(c => c === originalName ? name : c));
      } else {
        setIncomeTypes(prev => prev.map(c => c === originalName ? name : c));
      }
    } else if (isNew) {
      // Automatically activate new categories
      if (type === 'expense') setExpenseCats(prev => [...prev, name]);
      else setIncomeTypes(prev => [...prev, name]);
    }

    setEditModal(null);
    toast.success(`${isNew ? 'Added' : 'Updated'} ${name}`);
  };

  const handleDeleteItem = (item, type) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    setCustomCats(prev => prev.filter(c => !(c.type === type && c.name === item.name)));
    
    if (type === 'expense') {
      setExpenseCats(prev => prev.filter(c => c !== item.name));
    } else {
      setIncomeTypes(prev => prev.filter(c => c !== item.name));
    }
    toast.success(`Deleted ${item.name}`);
  };

  const totalActive = expenseCats.length;
  const totalAll = effectiveSections.reduce((s, sec) => s + sec.items.length, 0);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>Master Settings</h1>
          <p style={{ color: C.textMuted, fontSize: 13.5, marginTop: 5 }}>Configure expense categories and income types used across the app</p>
        </div>
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

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab === 'expenses' ? (
              <>
                <span style={{ fontSize: 13, color: C.textMuted }}>
                  <span style={{ fontWeight: 600, color: C.textPrimary }}>{totalActive}</span> of {totalAll} categories active
                </span>
                <span style={{ fontSize: 11, color: C.textMuted, background: C.bgPage, border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: 99 }}>
                  {effectiveSections.length} sections
                </span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: C.textMuted }}>
                <span style={{ fontWeight: 600, color: C.textPrimary }}>{incomeTypes.length}</span> income types configured
              </span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, fontSize: 14, pointerEvents: 'none' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ ...iSt(), paddingLeft: 30, width: 220, fontSize: 13 }} />
          </div>
        </div>

        {activeTab === 'expenses' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {effectiveSections.map(sec => (
              <div key={sec.section} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
                <div style={{ padding: '11px 18px', background: C.bgPage, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color.dot, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{sec.section}</span>
                    <span style={{ fontSize: 11.5, color: C.textMuted, marginLeft: 2 }}>
                      ({sec.items.filter(i => activeExpenseSet.has(i.name)).length}/{sec.items.length} active)
                    </span>
                  </div>
                  <button 
                    onClick={() => setEditModal({ type: 'expense', section: sec.section, isNew: true })}
                    style={{ background: C.accentLight, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>+</span> Add Category
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))' }}>
                  {sec.items.map(item => {
                    const isActive = activeExpenseSet.has(item.name);
                    const isCustom = !CAT_COLORS[item.originalName || item.name];
                    return (
                      <div key={item.name} className="row-hover"
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 16px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: isActive ? 'transparent' : `${C.bgPage}88`, transition: 'all .15s', position: 'relative' }}>
                        <div onClick={() => toggleExpense(item.name)} style={{ width: 16, height: 16, borderRadius: 4, marginTop: 2, flexShrink: 0, border: `1.5px solid ${isActive ? sec.color.dot : C.borderMid}`, background: isActive ? sec.color.dot : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {isActive && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.3, color: isActive ? C.textPrimary : C.textMuted }}>{item.name}</div>
                          {item.desc && <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>}
                        </div>
                        <div className="row-actions" style={{ display: 'flex', gap: 4 }}>
                          <button 
                            onClick={() => setEditModal({ type: 'expense', section: sec.section, item, isNew: false })}
                            style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 12, padding: 4 }}
                            title="Edit"
                          >✎</button>
                          {(isCustom || item.isEdited) && (
                            <button 
                              onClick={() => handleDeleteItem(item, 'expense')}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: 4 }}
                              title="Delete"
                            >✕</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
             <div style={{ padding: '11px 18px', background: C.bgPage, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>Income Types</span>
                <button 
                  onClick={() => setEditModal({ type: 'income', isNew: true })}
                  style={{ background: C.accentLight, border: `1px solid ${C.accentBorder}`, color: C.accent, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Type
                </button>
             </div>
             <div style={{ padding: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))' }}>
                  {effectiveIncomes.map(item => {
                    const isActive = activeIncomeSet.has(item.name);
                    const col = INC_COLORS[item.originalName || item.name] || { dot: '#9b9890', bg: '#f2f1ee', border: '#cccab8' };
                    return (
                      <div key={item.name} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
                        <div onClick={() => toggleIncome(item.name)} style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${isActive ? col.dot : C.borderMid}`, background: isActive ? col.dot : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {isActive && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ flex: 1, fontSize: 13.5, color: isActive ? C.textPrimary : C.textMuted }}>{item.name}</span>
                        <div className="row-actions" style={{ display: 'flex', gap: 4 }}>
                          <button 
                            onClick={() => setEditModal({ type: 'income', item, isNew: false })}
                            style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 12, padding: 4 }}
                          >✎</button>
                          {(item.isEdited || !INC_COLORS[item.name]) && (
                            <button 
                              onClick={() => handleDeleteItem(item, 'income')}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: 4 }}
                            >✕</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Modal - Implementation of Edit/Add Category */}
      {editModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 400, boxShadow: C.shadowLg }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{editModal.isNew ? 'Add' : 'Edit'} {editModal.type === 'expense' ? 'Category' : 'Income Type'}</h2>
            {editModal.section && <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Section: {editModal.section}</p>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: editModal.section ? 0 : 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Name</label>
                <input 
                  autoFocus
                  defaultValue={editModal.item?.name || ''} 
                  id="modal-cat-name"
                  placeholder="e.g. Pet Care"
                  style={{ ...iSt(), width: '100%' }}
                />
              </div>
              {editModal.type === 'expense' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Description (Optional)</label>
                  <textarea 
                    defaultValue={editModal.item?.desc || ''} 
                    id="modal-cat-desc"
                    placeholder="Brief description..."
                    style={{ ...iSt(), width: '100%', minHeight: 60, resize: 'none' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => setEditModal(null)} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${C.border}`, background: 'none', fontSize: 13.5 }}>Cancel</button>
              <button 
                onClick={() => {
                  const name = document.getElementById('modal-cat-name').value;
                  const desc = editModal.type === 'expense' ? document.getElementById('modal-cat-desc').value : '';
                  handleSaveItem({ ...editModal, name, desc, originalName: editModal.item?.originalName || editModal.item?.name });
                }} 
                className="btn-primary" 
                style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}
              >Save changes</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, background: C.accentLight, border: `1px solid ${C.accentBorder}`, borderRadius: 12, padding: 20 }}>
        <p style={{ fontWeight: 700, color: C.accent, marginBottom: 8, fontSize: 15 }}>Category Management</p>
        <ul style={{ color: C.textSecondary, fontSize: 13.5, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>Add new categories within specific sections to keep them organized.</li>
          <li>Edit descriptions or names of existing categories to better suit your needs.</li>
          <li>Check/uncheck items to control visibility in the expense grid.</li>
          <li>System defaults are preserved — you can always delete your edits to restore them.</li>
        </ul>
      </div>

      <style jsx>{`
        .row-hover .row-actions { opacity: 0; transition: opacity 0.2s; }
        .row-hover:hover .row-actions { opacity: 1; }
      `}</style>
    </div>
  );
}
