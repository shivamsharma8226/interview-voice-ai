'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  Mic2,
  Sparkles,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  PlayCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide on interview room pages so the room gets the full viewport
  const isInterviewRoom = /^\/interviews\/[^/]+$/.test(pathname || '') && pathname !== '/interviews/new';
  if (isInterviewRoom) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/dashboard');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/interviews/new', label: 'Start Interview', icon: PlayCircle },
    { href: '/resumes', label: 'Resumes', icon: FileText },
    { href: '/history', label: 'History', icon: History },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E9E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1F2937] flex items-center gap-1.5">
                Interview<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">AI</span>
              </span>
              <span className="block text-[10px] text-slate-400 -mt-1 font-mono uppercase tracking-wider">
                Interview practice, made practical
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#F3E8FF] text-[#6D28D9] border border-[#D8B4FE]'
                        : 'text-slate-500 hover:text-[#1F2937] hover:bg-[#F4F1ED]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right-side account actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700 font-medium bg-white px-3 py-1.5 rounded-lg border border-[#E9E5DF]">
                  <UserIcon className="w-4 h-4 text-violet-400" />
                  <span>{user.name.split(' ')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-[#FFF0ED] rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                className="text-sm font-medium text-slate-600 hover:text-[#1F2937] px-3 py-2 rounded-lg transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 rounded-lg shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Start Free Practice
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-[#1F2937] hover:bg-[#F4F1ED] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-[#E9E5DF] px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-[#F4F1ED]"
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-[#E9E5DF] flex items-center justify-between">
                <span className="text-sm text-slate-500">Signed in as {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm text-slate-700 bg-[#F4F1ED] rounded-lg"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm text-white bg-indigo-600 rounded-lg"
              >
                Start Free Practice
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
