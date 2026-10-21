'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { InterviewItem } from '@/lib/types';
import {
  History,
  Search,
  Filter,
  PlayCircle,
  FileText,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
} from 'lucide-react';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadHistory();
    }
  }, [user, authLoading, selectedCategory, selectedState]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getInterviews({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        state: selectedState !== 'all' ? selectedState : undefined,
        limit: 50,
      });
      setInterviews(data.interviews);
    } catch (err: any) {
      setError(err.message || 'Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview session and its records?')) {
      return;
    }

    try {
      await api.deleteInterview(id);
      setInterviews(interviews.filter((item) => item._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete interview');
    }
  };

  const filteredInterviews = interviews.filter((item) =>
    item.targetRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || (loading && !interviews.length)) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Interview History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review past mock interview sessions, evaluate scores, and inspect detailed diagnostic reports.
          </p>
        </div>

        <Link
          href="/interviews/new"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25 flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Practice Session</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="system_design">System Design</option>
              <option value="fullstack">Full-Stack</option>
              <option value="behavioral">Behavioral</option>
              <option value="coding">Coding</option>
              <option value="hr">HR</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="asking">In Progress</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* SESSIONS LIST */}
      {filteredInterviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInterviews.map((item) => {
            const isCompleted = item.state === 'completed';
            const score = item.overallScore;

            return (
              <div
                key={item._id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 capitalize">
                      {item.interviewType}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.state.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{item.targetRole}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <span className="text-indigo-400 font-medium">{item.difficulty}</span> difficulty
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    {isCompleted && score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-bold text-white">{score}%</span>
                        <span className="text-[11px] text-slate-400">Score</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">In Progress</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteSession(item._id)}
                      title="Delete interview session"
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {isCompleted ? (
                      <Link
                        href={`/interviews/${item._id}/report`}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={`/interviews/${item._id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <span>Resume</span>
                        <PlayCircle className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No interview records match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Conduct a mock interview session to build your performance profile and track your growth.
          </p>
          <Link
            href="/interviews/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition shadow-md shadow-indigo-600/20"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start an Interview</span>
          </Link>
        </div>
      )}
    </div>
  );
}
