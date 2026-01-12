
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@/types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Diagnostic Medicine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        // Auth state change will be handled in App.tsx typically, 
        // but for immediate feedback or if we want to pass data manually:
        // We'll let the onAuthStateChange in App.tsx handle the redirect and state update.
        // However, we might want to call onAuthSuccess to ensure compatibility if App.tsx isn't fully reactive yet.
        // Let's rely on the App.tsx listener for state, we just need to ensure no error here.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              specialty,
            },
          },
        });

        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('This email is already registered. Please sign in instead.');
          return;
        }

        // If successful, show verification message
        setVerificationSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFDFB]">
        <div className="max-w-md w-full bg-white p-8 rounded-[24px] shadow-2xl shadow-black/5 border border-black/5 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Verify Account</h2>
          <p className="text-sm font-medium text-black/60 leading-relaxed">
            An authentication link has been sent to <strong>{email}</strong>. Please check your inbox and click the verify button to activate your clinical access.
          </p>
          <button
            onClick={() => { setVerificationSent(false); setIsLogin(true); }}
            className="w-full btn-nordic py-3 text-[9px] font-black uppercase tracking-[0.4em] shadow-xl shadow-black/10"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFDFB] relative">
      <div className="max-w-md w-full space-y-6">
        <div className="absolute top-6 left-6">
          <button onClick={onBack} className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Home
          </button>
        </div>
        <div className="text-center space-y-2 pt-8">
          {/* Abort Access button removed as it is replaced by Home button */}
          <h1 className="text-3xl font-extrabold tracking-tighter">{isLogin ? 'Sign In' : 'Sign Up'}</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-600">Secure Protocol Access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[24px] space-y-5 shadow-2xl shadow-black/5 border border-black/5">
          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-xl text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest text-black/30">Registry Name</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full text-sm font-bold bg-transparent border-b-2 border-black/5 focus:outline-none focus:border-blue-600 transition-colors py-2"
                placeholder="Full Name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-black/30">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm font-bold bg-transparent border-b-2 border-black/5 focus:outline-none focus:border-blue-600 transition-colors py-2"
              placeholder="id@hospital.org"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black uppercase tracking-widest text-black/30">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm font-bold bg-transparent border-b-2 border-black/5 focus:outline-none focus:border-blue-600 transition-colors py-2"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-nordic py-2.5 text-[8px] font-black uppercase tracking-[0.4em] shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-[8px] font-black uppercase tracking-widest text-black/20 hover:text-black transition-all underline underline-offset-4"
          >
            {isLogin ? 'Create an account' : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
