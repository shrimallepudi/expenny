import { useState, useEffect } from 'react';
import { C } from '@/lib/constants';
import { getWorkspaceLogs } from '@/lib/db';
import { toast } from 'react-hot-toast';

export default function ActivityView({ workspace }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    setLoading(true);
    getWorkspaceLogs(workspace.id)
      .then(setLogs)
      .catch(err => toast.error('Failed to load activity: ' + err.message))
      .finally(() => setLoading(false));
  }, [workspace]);

  const getActionLabel = (log) => {
    const action = log.action;
    const type = log.entity_type;
    const d = log.details || {};
    
    if (type === 'transactions') {
      const et = d.type || 'item';
      if (action === 'INSERT') return `Added ${et}: ${d.category} (₹${Number(d.amount).toLocaleString()})`;
      
      if (action === 'UPDATE') {
        let changes = [];
        if (d.old_category && d.old_category !== d.category) changes.push(`category from "${d.old_category}" to "${d.category}"`);
        if (d.old_amount && Number(d.old_amount) !== Number(d.amount)) changes.push(`amount from ₹${Number(d.old_amount).toLocaleString()} to ₹${Number(d.amount).toLocaleString()}`);
        
        if (changes.length > 0) return `Updated ${et} ${changes.join(' and ')}`;
        return `Updated ${et}: ${d.category}`;
      }
      
      if (action === 'DELETE') return `Deleted ${et}: ${d.category} (₹${Number(d.amount).toLocaleString()})`;
    }
    return `${action} on ${type}`;
  };

  if (!workspace) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Activity Log</h1>
        <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 4 }}>Recent changes in {workspace.name}</p>
      </div>

      <div style={{ background: C.bgPanel, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadowSm }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: 12, color: C.textMuted, fontSize: 13 }}>Loading activity...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: C.textMuted, fontSize: 14 }}>No activity recorded yet for this workspace.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((log, i) => (
              <div 
                key={log.id} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: i < logs.length - 1 ? `1px solid ${C.border}` : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16
                }}
              >
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 10, 
                  background: log.action === 'DELETE' ? C.redLight : log.action === 'INSERT' ? C.greenLight : C.yellowLight, 
                  color: log.action === 'DELETE' ? C.red : log.action === 'INSERT' ? C.green : C.yellow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  marginTop: 2
                }}>
                  {log.action === 'INSERT' ? '＋' : log.action === 'DELETE' ? '－' : '✎'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary }}>
                      {log.profiles?.email?.split('@')[0] || 'Unknown User'}
                    </span>
                    <span style={{ fontSize: 11.5, color: C.textMuted }}>
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.4 }}>
                    {getActionLabel(log)}
                  </div>
                  {log.details?.amount && (
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, fontWeight: 500 }}>
                      Amount: ₹{Number(log.details.amount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
