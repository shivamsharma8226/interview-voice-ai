'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  Mic2,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

// Colors are arbitrary values on purpose: globals.css remaps the named
// text-white / slate / indigo utilities with !important, which would wash out
// copy on the dark panel.
const inputClass =
  'w-full pl-10 pr-4 py-3 bg-white border border-[#D9D3CC] rounded-xl text-sm text-[#1F2937] placeholder:text-[#A8A29E] hover:border-[#B9B1A8] focus:outline-none focus:border-[#6D28D9] focus:ring-4 focus:ring-[#F3E8FF] transition disabled:bg-[#F4F1ED]';

const benefits = [
  'Resume-aware practice sessions',
  'Voice interviews with instant feedback',
  'Track progress across every attempt',
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14 relative overflow-hidden">
      <div className="absolute -top-16 left-1/4 w-80 h-80 bg-[#F3E8FF] rounded-full blur-3xl opacity-80 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#FDE8E4] rounded-full blur-3xl opacity-70 pointer-events-none" />

      <div className="w-full max-w-4xl relative grid md:grid-cols-[0.95fr_1.05fr] rounded-3xl overflow-hidden border border-[#E9E5DF] bg-white shadow-[0_24px_70px_rgba(31,41,55,0.10)]">
        <aside className="relative overflow-hidden bg-gradient-to-br from-[#2D1B69] to-[#4C1D95] p-7 sm:p-10 flex flex-col justify-between">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#ffffff]/5 pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-[#ffffff]/5 pointer-events-none" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span className="w-10 h-10 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-[#ffffff] group-hover:scale-110 transition" />
              </span>
              <span className="text-xl font-bold tracking-tight text-[#ffffff]">InterviewAI</span>
            </Link>

            <p className="mt-8 md:mt-12 text-xs font-semibold tracking-[0.18em] text-[#D8B4FE]">WELCOME BACK</p>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight text-[#ffffff]">
              Continue with focused practice.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#EDE9FE]/80">
              Your sessions, feedback, and interview history are ready when you are.
            </p>
          </div>

          <ul className="relative mt-8 md:mt-10 space-y-3 text-sm text-[#EDE9FE] hidden sm:block">
            {benefits.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#F4C7A1]" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3E8FF] text-xs font-medium text-[#6D28D9]">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure sign in
            </div>
            <h2 className="mt-4 text-2xl font-bold text-[#1F2937]">Sign in to your workspace</h2>
            <p className="mt-1.5 text-sm text-[#78716C]">Use your account to continue where you left off.</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-[#FFF0ED] border border-[#F3B5A7] text-[#C2412D] text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#44403C] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  autoFocus
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#44403C] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#A8A29E] hover:text-[#6D28D9] hover:bg-[#F3E8FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] active:scale-[0.99] text-[#ffffff] font-semibold text-sm transition shadow-lg shadow-[#6D28D9]/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E9D5FF] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-[#E9E5DF] text-center text-sm text-[#78716C]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#6D28D9] hover:text-[#5B21B6] hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
