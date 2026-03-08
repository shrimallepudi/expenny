import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { C, FULL_MONTHS } from '@/lib/constants';

// Helper for date string (YYYY-MM-DD)
const toDateStr = (d) => d.toISOString().split('T')[0];

const PRESET_RANGES = [
  { label: 'This Week', get: () => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay()); // Sunday
      const e = new Date(d); e.setDate(e.getDate() + 6);
      return [toDateStr(d), toDateStr(e)];
  }},
  { label: 'This Month', get: () => {
      const d = new Date();
      return [toDateStr(new Date(d.getFullYear(), d.getMonth(), 1)), toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  }},
  { label: 'Last Month', get: () => {
      const d = new Date();
      return [toDateStr(new Date(d.getFullYear(), d.getMonth() - 1, 1)), toDateStr(new Date(d.getFullYear(), d.getMonth(), 0))];
  }},
  { label: 'Last 3 Months', get: () => {
      const d = new Date();
      return [toDateStr(new Date(d.getFullYear(), d.getMonth() - 3, 1)), toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  }},
  { label: 'This Year', get: () => {
      const d = new Date();
      return [toDateStr(new Date(d.getFullYear(), 0, 1)), toDateStr(new Date(d.getFullYear(), 11, 31))];
  }},
  { label: 'All Time', get: () => ['2000-01-01', '2100-12-31'] },
];

export default function ReportsView({ transactions, expenseCats, incomeTypes }) {
  const [dateRange, setDateRange]   = useState(PRESET_RANGES[1].get()); // Default: This Month
  const [filterType, setFilterType] = useState('all'); // 'all' | 'expense' | 'income'
  const [filterCat, setFilterCat]   = useState('all');

  const availableCats = useMemo(() => Array.from(new Set(transactions.map(t => t.category))), [transactions]);

  // Filter transactions
  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      // Date Check
      if (t.date < dateRange[0] || t.date > dateRange[1]) return false;
      // Type Check
      if (filterType !== 'all' && t.type !== filterType) return false;
      // Category Check
      if (filterCat !== 'all' && t.category !== filterCat) return false;
      return true;
    });
  }, [transactions, dateRange, filterType, filterCat]);

  // Stats
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const expByCategory = {};

    filteredTxs.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else {
        totalExpense += t.amount;
        expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
      }
    });

    return { totalIncome, totalExpense, expByCategory };
  }, [filteredTxs]);

  // Chart: Income vs Expense Trend (Grouped by Date)
  const trendOption = useMemo(() => {
    const grouped = {};
    filteredTxs.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = { income: 0, expense: 0 };
      grouped[t.date][t.type] += t.amount;
    });
    
    // Sort dates
    const dates = Object.keys(grouped).sort();
    
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Income', 'Expense'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates, splitLine: { show: false } },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        { name: 'Income', type: 'bar', data: dates.map(d => grouped[d].income), itemStyle: { color: C.green, borderRadius: [4, 4, 0, 0] } },
        { name: 'Expense', type: 'bar', data: dates.map(d => grouped[d].expense), itemStyle: { color: C.red, borderRadius: [4, 4, 0, 0] } }
      ]
    };
  }, [filteredTxs]);

  // Chart: Expense Breakdown (Doughnut)
  const categoryOption = useMemo(() => {
    const data = Object.entries(stats.expByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      tooltip: { trigger: 'item', formatter: '{b}: ₹{c} ({d}%)' },
      legend: { type: 'scroll', orient: 'vertical', right: 10, top: 20, bottom: 20 },
      series: [
        {
          name: 'Expense by Category',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          data: data
        }
      ]
    };
  }, [stats.expByCategory]);

  const formatMoney = (v) => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ── Granular Filters ── */}
      <div style={{ background: C.bgPanel, padding: 20, borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        
        {/* Preset Ranges */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PRESET_RANGES.map((r, i) => (
            <button key={i} onClick={() => setDateRange(r.get())}
              style={{ padding: '6px 12px', fontSize: 13, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgPage, color: C.textPrimary, cursor: 'pointer' }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>Start Date</label>
             <input type="date" value={dateRange[0]} onChange={(e) => setDateRange([e.target.value, dateRange[1]])} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, outline: 'none' }} />
           </div>
           <span style={{ color: C.textMuted, marginTop: 20 }}>→</span>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <label style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>End Date</label>
             <input type="date" value={dateRange[1]} onChange={(e) => setDateRange([dateRange[0], e.target.value])} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, outline: 'none' }} />
           </div>
        </div>

        {/* Type & Category */}
        <div style={{ display: 'flex', gap: 12, width: '100%', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterCat('all'); }} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, outline: 'none' }}>
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, outline: 'none' }}>
            <option value="all">All Categories</option>
            {availableCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ background: C.bgPanel, padding: 20, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, color: C.textMuted }}>Total Income</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.green }}>{formatMoney(stats.totalIncome)}</div>
        </div>
        <div style={{ background: C.bgPanel, padding: 20, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, color: C.textMuted }}>Total Expense</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.red }}>{formatMoney(stats.totalExpense)}</div>
        </div>
        <div style={{ background: C.bgPanel, padding: 20, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, color: C.textMuted }}>Net Savings</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>{formatMoney(stats.totalIncome - stats.totalExpense)}</div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 3fr)', gap: 24 }}>
        
        {/* Trend Chart */}
        <div style={{ background: C.bgPanel, padding: 20, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>Trend Over Time</h3>
          {filteredTxs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: C.textMuted }}>No data available</div>
          ) : (
            <ReactECharts option={trendOption} style={{ height: 350 }} />
          )}
        </div>

        {/* Category Breakdown */}
        <div style={{ background: C.bgPanel, padding: 20, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>Expense Breakdown</h3>
          {Object.keys(stats.expByCategory).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: C.textMuted }}>No expenses to categorize</div>
          ) : (
            <ReactECharts option={categoryOption} style={{ height: 350 }} />
          )}
        </div>

      </div>
    </div>
  );
}
