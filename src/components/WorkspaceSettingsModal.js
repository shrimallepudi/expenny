import { useState, useEffect } from 'react';
import { C } from '@/lib/constants';
import { iSt } from './ui';
import { toast } from 'react-hot-toast';
import { getWorkspaceMembers, createInvite, updateWorkspaceName } from '@/lib/db';

export default function WorkspaceSettingsModal({ workspace, onClose }) {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  // Workspace rename state
  const [wsName, setWsName] = useState(workspace?.name || '');
  const [renaming, setRenaming] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Activity log state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isOwner = workspace?.role === 'owner';

  useEffect(() => {
    if (!workspace) return;
    setLoadingMembers(true);
    getWorkspaceMembers(workspace.id)
      .then(setMembers)
      .catch((e) => toast.error('Failed to load members: ' + e.message))
      .finally(() => setLoadingMembers(false));
  }, [workspace]);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!wsName.trim() || wsName === workspace.name) return;
    setRenaming(true);
    try {
      await updateWorkspaceName(workspace.id, wsName.trim());
      toast.success('Workspace renamed successfully!');
      // Refresh page to show new name in Sidebar etc.
      window.location.reload();
    } catch (e) {
      toast.error('Failed to rename: ' + e.message);
    } finally {
      setRenaming(false);
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      return toast.error('Please enter a valid email address');
    }
    
    setInviteLoading(true);
    setInviteLink('');
    try {
      const email = inviteEmail.trim().toLowerCase();
      const token = await createInvite(workspace.id, inviteRole, email);
      const link = `${window.location.origin}/invite?token=${token}`;
      setInviteLink(link);
      navigator.clipboard.writeText(link);
      toast.success('Invite link generated and copied to clipboard!');
      setInviteEmail('');
    } catch (e) {
      toast.error('Failed to generate invite: ' + e.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const getActionLabel = (log) => {
    const action = log.action;
    const type = log.entity_type;
    if (type === 'transactions') {
      const et = log.details?.type || 'item';
      if (action === 'INSERT') return `Added ${et}: ${log.details?.category}`;
      if (action === 'UPDATE') return `Updated ${et}: ${log.details?.category}`;
      if (action === 'DELETE') return `Deleted ${et}: ${log.details?.category}`;
    }
    return `${action} on ${type}`;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26,25,21,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />
      
      <div className="fade-up" style={{ position: 'relative', width: '100%', maxWidth: 500, background: C.bgPage, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.bgPage, zIndex: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Workspace Settings</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 13, background: C.accentLight, color: C.accent, padding: '2px 8px', borderRadius: 99, fontWeight: 600, textTransform: 'capitalize' }}>{workspace.role}</span>
              <span style={{ fontSize: 13, color: C.textSecondary }}>•</span>
              <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500 }}>{workspace.name}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: C.textMuted, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {isOwner && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 12 }}>Workspace Details</h3>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <form onSubmit={handleRename} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Workspace Name</label>
                    <input value={wsName} onChange={e => setWsName(e.target.value)} style={{ ...iSt(), width: '100%' }} placeholder="Workspace Name" />
                  </div>
                  <div style={{ alignSelf: 'flex-end' }}>
                    <button type="submit" disabled={renaming || wsName === workspace.name} className="btn-ghost" style={{ border: `1px solid ${C.border}`, padding: '8px 12px', fontSize: 13, height: 38 }}>
                      {renaming ? '...' : 'Rename'}
                    </button>
                  </div>
                </form>
              </div>

              <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 12 }}>Invite Collaborator</h3>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                <form onSubmit={handleGenerateInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Email Address</label>
                    <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" style={{ ...iSt(), width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Role</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...iSt(), width: '100%' }}>
                      <option value="editor">Editor (Can add/edit transactions)</option>
                      <option value="viewer">Viewer (Can only view data)</option>
                    </select>
                  </div>
                  <button type="submit" disabled={inviteLoading} className="btn-primary" style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '10px 0', cursor: inviteLoading ? 'not-allowed' : 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', opacity: inviteLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {inviteLoading && <div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderWidth: 2 }} />}
                    Generate Secure Link
                  </button>
                </form>
                {inviteLink && (
                  <div className="fade-up" style={{ marginTop: 16, background: C.greenLight, border: `1px solid ${C.greenBorder}`, padding: 12, borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: C.textPrimary, marginBottom: 8 }}>Invite link generated for <strong style={{ color: C.green }}>{inviteLink.includes('?') ? new URL(inviteLink).searchParams.get('email') : ''}</strong>:</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input readOnly value={inviteLink} style={{ ...iSt(), flex: 1, background: '#fff' }} />
                      <button onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Copied!'); }} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>Copy</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 12 }}>Workspace Members</h3>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {loadingMembers ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : members.length === 0 ? (
               <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No other members found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {members.map((member, i) => (
                  <div key={member.user_id} className="row-hover" style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accentLight, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                      {member.role === 'owner' ? '👑' : '👤'}
                    </div>
                    <div style={{ marginLeft: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>User ID: {member.user_id.substring(0,8)}...</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2, textTransform: 'capitalize' }}>Role: {member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
