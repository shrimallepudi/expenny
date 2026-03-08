'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { C } from '@/lib/constants';

export default function LoginPage() {
  const [mode, setMode]       = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
        setMessage('Check your email for a password reset link.');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email to confirm, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', background: C.bgPage, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 13px', color: C.textPrimary,
    fontSize: 14, outline: 'none', marginTop: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 14 }}>₹</div>
          <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.4px' }}>Expensa</div>
          <div style={{ color: C.textMuted, fontSize: 13.5, marginTop: 4 }}>Expense & Budget Tracker</div>
        </div>

        {/* Card */}
        <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 28px 24px', boxShadow: C.shadowMd }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 22 }}>
            {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Create an account' : 'Reset password'}
          </h2>

          {error && (
            <div style={{ background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: '10px 13px', marginBottom: 16, fontSize: 13.5, color: C.red }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: C.greenLight, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: '10px 13px', marginBottom: 16, fontSize: 13.5, color: C.green }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
            </div>

            {mode !== 'forgot' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <div className="spinner" style={{ borderTopColor: '#fff', width: 16, height: 16 }} />}
              {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>
          </form>

          {/* Mode toggles */}
          <div style={{ marginTop: 18, fontSize: 13, color: C.textMuted, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mode === 'login' && <>
              <span>Don't have an account? <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>Sign up</button></span>
              <button onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit', textDecoration: 'underline' }}>Forgot password?</button>
            </>}
            {mode === 'signup' && (
              <span>Already have an account? <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>Sign in</button></span>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>← Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
