'use client';
import { useState, useCallback, useRef } from 'react';
import { C, FULL_MONTHS, getColor, fmt, padZ, daysInMonth } from '@/lib/constants';

const today = new Date();
const CY = today.getFullYear(), CM = today.getMonth();

const LinedCommentIcon = ({ color, size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>
);

export default function SheetGrid({ year, month, transactions, saveSheet, onBack, expenseCats, incomeTypes, saving }) {
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);
  const allCats = [...expenseCats, ...incomeTypes];

  const initGrid = useCallback(() => {
    const monthKey = `${year}-${padZ(month + 1)}`;
    const g = {};
    allCats.forEach(cat => { g[cat] = {}; });
    transactions.filter(t => t.date.startsWith(monthKey)).forEach(t => {
      const day = parseInt(t.date.slice(8));
      if (!g[t.category]) g[t.category] = {};
      g[t.category][day] = {
        amount: Number(t.amount).toString(),
        note: t.note || ''
      };
    });
    return g;
  }, [allCats, month, year, transactions]);

  const [grid, setGrid] = useState(initGrid);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusedCell, setFocusedCell] = useState(null); // { cat, day }
  const [popoverCell, setPopoverCell] = useState(null); // { cat, day }
  const [tempNote, setTempNote] = useState('');
  const blurTimeoutRef = useRef(null);

  const rowTotal = cat => dayArr.reduce((s, d) => s + Number(grid[cat]?.[d]?.amount || 0), 0);
  const dayExpense = d => expenseCats.reduce((s, c) => s + Number(grid[c]?.[d]?.amount || 0), 0);
  const dayIncome = d => incomeTypes.reduce((s, c) => s + Number(grid[c]?.[d]?.amount || 0), 0);
  const totalExpense = dayArr.reduce((s, d) => s + dayExpense(d), 0);
  const totalIncome = dayArr.reduce((s, d) => s + dayIncome(d), 0);

  const handleCell = (cat, day, val) => {
    setGrid(g => {
      const existing = g[cat]?.[day] || { amount: '', note: '' };
      const newAmount = val;
      const newNote = newAmount === '' ? '' : existing.note;
      return {
        ...g,
        [cat]: {
          ...g[cat],
          [day]: { amount: newAmount, note: newNote }
        }
      };
    });
    setDirty(true); setSaved(false);
  };

  const openPopover = (cat, day) => {
    const note = grid[cat]?.[day]?.note || '';
    setPopoverCell({ cat, day });
    setTempNote(note);
  };

  const saveNote = () => {
    if (!popoverCell) return;
    const { cat, day } = popoverCell;
    setGrid(g => ({
      ...g,
      [cat]: {
        ...g[cat],
        [day]: { ...g[cat][day], note: tempNote }
      }
    }));
    setDirty(true); setSaved(false);
    setPopoverCell(null);
  };

  const handleSave = async () => {
    const newTxList = [];
    allCats.forEach(cat => {
      const type = expenseCats.includes(cat) ? 'expense' : 'income';
      dayArr.forEach(d => {
        const cell = grid[cat]?.[d];
        const amt = parseFloat(cell?.amount);
        if (!isNaN(amt) && amt > 0) newTxList.push({
          date: `${year}-${padZ(month + 1)}-${padZ(d)}`,
          type, category: cat, amount: amt, note: cell?.note || '', recurring: false, recurringFreq: 'monthly',
        });
      });
    });
    await saveSheet(year, month, newTxList);
    setSaved(true); setDirty(false);
    setTimeout(() => onBack(), 500);
  };

  const todayDay = (CY === year && CM === month) ? today.getDate() : null;

  const tdC = (isToday, extra = {}) => ({
    padding: '5px 8px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
    minWidth: 64, background: isToday ? C.accentLight : C.bgPanel, ...extra,
  });
  const th = (isToday) => ({
    padding: '8px 6px', textAlign: 'center', fontSize: 11, fontWeight: 600,
    color: isToday ? C.accent : C.textMuted,
    background: isToday ? C.accentLight : C.bgPage,
    borderRight: `1px solid ${C.border}`, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap',
  });

  const sectionLabel = (label, color) => (
    <tr>
      <td colSpan={days + 2} style={{ padding: '5px 14px', background: color + '22', borderBottom: `1px solid ${color}55`, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
      </td>
    </tr>
  );

  const totalRow = (label, dayFn, total, color, bgColor) => (
    <tr>
      <td style={{ padding: '7px 14px', position: 'sticky', left: 0, zIndex: 2, background: bgColor, borderRight: `2px solid ${C.borderMid}`, borderTop: `1px solid ${color}55`, borderBottom: `1px solid ${color}55` }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color }}>{label}</span>
      </td>
      {dayArr.map(d => {
        const v = dayFn(d); return (
          <td key={d} style={{ ...tdC(d === todayDay), textAlign: 'right', fontWeight: 600, color: v > 0 ? color : C.textDisabled, background: d === todayDay ? bgColor : bgColor + '44', borderTop: `1px solid ${color}55`, borderBottom: `1px solid ${color}55` }}>
            {v > 0 ? fmt(v) : ''}
          </td>
        );
      })}
      <td style={{ ...tdC(false), textAlign: 'right', fontWeight: 700, color, position: 'sticky', right: 0, zIndex: 2, background: bgColor, borderLeft: `2px solid ${C.borderMid}`, borderTop: `1px solid ${color}55`, borderBottom: `1px solid ${color}55` }}>
        {fmt(total)}
      </td>
    </tr>
  );

  return (
    <div className="fade-up">
      {/* Compact toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={onBack} className="btn-ghost" style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSecondary, borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>← Back</button>

        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{FULL_MONTHS[month]} {year}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          {[['Income', fmt(totalIncome), C.green], ['Expenses', fmt(totalExpense), C.red], ['Balance', (totalIncome >= totalExpense ? '+' : '') + fmt(totalIncome - totalExpense), totalIncome >= totalExpense ? C.green : C.red]].map(([lbl, val, col]) => (
            <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lbl}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{val}</span>
              <span style={{ color: C.border, fontSize: 12, marginLeft: 2 }}>·</span>
            </span>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {dirty && <span style={{ fontSize: 11.5, color: C.yellow, background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, padding: '3px 9px', borderRadius: 99 }}>Unsaved</span>}
          {saved && <span style={{ fontSize: 11.5, color: C.green, background: C.greenLight, border: `1px solid ${C.greenBorder}`, padding: '3px 9px', borderRadius: 99 }}>Saved ✓</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary"
            style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 7, padding: '6px 18px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving && <div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderWidth: 2 }} />}
            {saving ? 'Saving…' : 'Save & Close'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: C.shadow }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '78vh' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12.5, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ ...th(false), minWidth: 168, width: 168, textAlign: 'left', padding: '10px 14px', position: 'sticky', left: 0, zIndex: 11, background: C.bgPage, borderRight: `2px solid ${C.borderMid}` }}>Category</th>
                {dayArr.map(d => (
                  <th key={d} style={{ ...th(d === todayDay), width: 64 }}>
                    <div style={{ fontWeight: 700 }}>{d}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 400, marginTop: 1, opacity: .8 }}>
                      {new Date(year, month, d).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </div>
                  </th>
                ))}
                <th style={{ ...th(false), minWidth: 96, width: 96, position: 'sticky', right: 0, zIndex: 11, background: C.bgPage, color: C.textSecondary, borderLeft: `2px solid ${C.borderMid}` }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sectionLabel('Expenses', C.red)}
              {expenseCats.map(cat => {
                const rTotal = rowTotal(cat);
                const dotColor = getColor(cat, 'dot');
                const bgColor = getColor(cat, 'bg');
                return (
                  <tr key={cat} className="sheet-row">
                    <td className="sticky-left" style={{ padding: '6px 14px', position: 'sticky', left: 0, zIndex: 2, background: C.bgPanel, borderRight: `2px solid ${C.borderMid}`, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', minWidth: 168 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span style={{ color: C.textSecondary, fontSize: 13 }}>{cat}</span>
                      </div>
                    </td>
                    {dayArr.map(d => {
                      const cell = grid[cat]?.[d];
                      const isFocused = focusedCell?.cat === cat && focusedCell?.day === d;
                      const hasNote = !!cell?.note;
                      const hasAmount = !!cell?.amount;
                      return (
                        <td key={d} style={{ ...tdC(d === todayDay), position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input className="cell-input" type="number" min="0" placeholder="·"
                              value={cell?.amount || ''}
                              onChange={e => handleCell(cat, d, e.target.value)}
                              onFocus={() => {
                                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                                setFocusedCell({ cat, day: d });
                              }}
                              onBlur={() => {
                                blurTimeoutRef.current = setTimeout(() => setFocusedCell(null), 200);
                              }}
                              style={{ color: cell?.amount ? dotColor : undefined, flex: 1 }}
                            />
                            {hasAmount && (isFocused || hasNote || (popoverCell?.cat === cat && popoverCell?.day === d)) && (
                              <div
                                title={hasNote ? cell.note : "Add Note"}
                                onClick={() => openPopover(cat, d)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <LinedCommentIcon color={hasNote ? C.orange : C.textDisabled} size={16} />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ ...tdC(false), textAlign: 'right', fontWeight: 600, color: rTotal > 0 ? dotColor : C.textDisabled, position: 'sticky', right: 0, zIndex: 2, background: rTotal > 0 ? bgColor : C.bgPanel, borderLeft: `2px solid ${C.borderMid}` }}>
                      {rTotal > 0 ? fmt(rTotal) : '—'}
                    </td>
                  </tr>
                );
              })}
              {totalRow('Day Total', dayExpense, totalExpense, C.red, C.redLight)}

              {sectionLabel('Income', C.green)}
              {incomeTypes.map(cat => {
                const rTotal = rowTotal(cat);
                const dotColor = getColor(cat, 'dot');
                const bgColor = getColor(cat, 'bg');
                return (
                  <tr key={cat} className="sheet-row">
                    <td className="sticky-left" style={{ padding: '6px 14px', position: 'sticky', left: 0, zIndex: 2, background: C.bgPanel, borderRight: `2px solid ${C.borderMid}`, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', minWidth: 168 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span style={{ color: C.textSecondary, fontSize: 13 }}>{cat}</span>
                      </div>
                    </td>
                    {dayArr.map(d => {
                      const cell = grid[cat]?.[d];
                      const isFocused = focusedCell?.cat === cat && focusedCell?.day === d;
                      const hasNote = !!cell?.note;
                      const hasAmount = !!cell?.amount;
                      return (
                        <td key={d} style={{ ...tdC(d === todayDay), position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                             <input className="cell-input" type="number" min="0" placeholder="·"
                               value={cell?.amount || ''}
                               onChange={e => handleCell(cat, d, e.target.value)}
                               onFocus={() => {
                                 if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                                 setFocusedCell({ cat, day: d });
                               }}
                               onBlur={() => {
                                 blurTimeoutRef.current = setTimeout(() => setFocusedCell(null), 200);
                               }}
                               style={{ color: cell?.amount ? dotColor : undefined, flex: 1 }}
                             />
                            {hasAmount && (isFocused || hasNote || (popoverCell?.cat === cat && popoverCell?.day === d)) && (
                              <div
                                title={hasNote ? cell.note : "Add Note"}
                                onClick={() => openPopover(cat, d)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <LinedCommentIcon color={hasNote ? C.orange : C.textDisabled} size={16} />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ ...tdC(false), textAlign: 'right', fontWeight: 600, color: rTotal > 0 ? dotColor : C.textDisabled, position: 'sticky', right: 0, zIndex: 2, background: rTotal > 0 ? bgColor : C.bgPanel, borderLeft: `2px solid ${C.borderMid}` }}>
                      {rTotal > 0 ? fmt(rTotal) : '—'}
                    </td>
                  </tr>
                );
              })}
              {totalRow('Day Total', dayIncome, totalIncome, C.green, C.greenLight)}

              {/* Net balance row */}
              <tr>
                <td style={{ padding: '9px 14px', position: 'sticky', left: 0, zIndex: 2, background: C.bgPage, borderRight: `2px solid ${C.borderMid}`, borderTop: `2px solid ${C.borderMid}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>Net Balance</span>
                </td>
                {dayArr.map(d => {
                  const v = dayIncome(d) - dayExpense(d); return (
                    <td key={d} style={{ ...tdC(d === todayDay), textAlign: 'right', fontWeight: 700, fontSize: 12, color: v > 0 ? C.green : v < 0 ? C.red : C.textDisabled, borderTop: `2px solid ${C.borderMid}`, background: d === todayDay ? C.accentLight : C.bgPage }}>
                      {v !== 0 ? (v > 0 ? '+' : '') + fmt(v) : ''}
                    </td>
                  );
                })}
                <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: (totalIncome - totalExpense) >= 0 ? C.green : C.red, position: 'sticky', right: 0, zIndex: 2, background: C.bgPage, borderLeft: `2px solid ${C.borderMid}`, borderTop: `2px solid ${C.borderMid}` }}>
                  {(totalIncome - totalExpense) >= 0 ? '+' : ''}{fmt(totalIncome - totalExpense)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {popoverCell && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.05)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setPopoverCell(null)}>
          <div style={{
            background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 12, width: 260, boxShadow: C.shadow, position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Note</span>
              <span>{popoverCell.day} {FULL_MONTHS[month].slice(0, 3)}</span>
            </div>
            <textarea
              autoFocus
              value={tempNote}
              onChange={e => setTempNote(e.target.value)}
              placeholder="Add details..."
              style={{
                width: '100%', minHeight: 60, background: C.bgPage, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: 8, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', resize: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
              <button
                onClick={() => setPopoverCell(null)}
                className="btn-ghost"
                style={{ padding: '4px 10px', fontSize: 11, borderRadius: 5 }}
              >Cancel</button>
              <button
                onClick={saveNote}
                className="btn-primary"
                style={{ padding: '4px 12px', fontSize: 11, background: C.orange, borderRadius: 5 }}
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
