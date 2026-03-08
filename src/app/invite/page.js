'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { acceptInvite } from '@/lib/db';
import { C } from '@/lib/constants';
import { Toaster, toast } from 'react-hot-toast';

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => {
        setUser(data.user);
      })
      .catch((err) => {
        console.error('Auth check failed:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleJoin = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (!user) {
        // Redirect to login if not authenticated, passing the token
        window.location.href = `/login?next=/invite?token=${token}`;
        return;
      }
      
      await acceptInvite(token);
      setSuccess(true);
      toast.success('Successfully joined workspace!', { style: { background: '#10b981', color: '#fff' }});
      
      // Redirect home after a brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (e) {
      setError(e.message || 'Failed to join workspace. The link might be invalid or expired.');
      toast.error('Failed to join', { style: { background: '#ef4444', color: '#fff' }});
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgPage, padding: 20 }}>
        <div style={{ background: C.bgPanel, padding: 30, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary }}>Invalid Invite Link</h2>
          <p style={{ color: C.textSecondary, marginTop: 8 }}>No invitation token was found in the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgPage, padding: 20 }}>
      <Toaster position="bottom-right" />
      <div style={{ background: C.bgPanel, padding: 32, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadowMd, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        
        <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentLight, color: C.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20 }}>
          🤝
        </div>
        
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You've been invited!</h1>
        <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
          You have been invited to join a collaborative workspace on Expensa.
        </p>
        
        {error && (
          <div style={{ background: C.redLight, color: C.red, padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20, border: `1px solid ${C.redBorder}` }}>
            {error}
          </div>
        )}
        
        {success ? (
          <div style={{ background: C.greenLight, color: C.green, padding: '12px 16px', borderRadius: 8, fontSize: 13, border: `1px solid ${C.greenBorder}` }}>
            <span style={{ fontWeight: 600 }}>Success!</span> Redirecting you to the dashboard...
          </div>
        ) : (
          <div>
            {!user ? (
              <div style={{ marginBottom: 20, fontSize: 13, color: C.textSecondary }}>
                You need to log in or create an account to accept this invitation.
              </div>
            ) : null}
            
            <button 
              onClick={handleJoin} 
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', background: C.accent, color: '#fff', border: 'none', padding: '12px 0', borderRadius: 8, fontSize: 14.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading && <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', borderWidth: 2 }} />}
              {loading ? 'Processing...' : user ? 'Accept Invitation' : 'Log In to Accept'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgPage }}><div className="spinner" /></div>}>
      <InviteContent />
    </Suspense>
  );
}
