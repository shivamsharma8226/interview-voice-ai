'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { InterviewItem } from '@/lib/types';
import {
  PlayCircle,
  Award,
  TrendingUp,
  Brain,
  History,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getInterviews({ limit: 15 });
      setInterviews(data.interviews);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (loading && !interviews.length)) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading your interview dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const completedInterviews = interviews.filter((i) => i.state === 'completed' && i.overallScore !== undefined);
  const totalCompleted = completedInterviews.length;

  const avgScore =
    totalCompleted > 0
      ? Math.round(
          completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / totalCompleted
        )
      : 0;

  // Chart data from completed interviews sorted by date
  const chartData = [...completedInterviews]
    .reverse()
    .map((item, idx) => ({
      index: `#${idx + 1}`,
      role: item.targetRole.length > 15 ? `${item.targetRole.substring(0, 15)}...` : item.targetRole,
      score: item.overallScore,
      date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));

  // Identify strongest and weakest areas
  let strongestSkill = 'System Design';
  let weakestSkill = 'Edge-Case Recovery';
  if (completedInterviews.length > 0 && completedInterviews[0].report?.skillScores?.length) {
    const scores = completedInterviews[0].report.skillScores;
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    if (sorted[0]) strongestSkill = sorted[0].skill;
    if (sorted[sorted.length - 1]) weakestSkill = sorted[sorted.length - 1].skill;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* WELCOME BANNER & PRIMARY CTA */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Practice Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Simulate realistic technical and behavioral interviews tailored directly to your target role and resume claims.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <Link
            href="/resumes"
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-sm font-medium text-slate-200 transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Manage Resumes</span>
          </Link>
          <Link
            href="/interviews/new"
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start New Interview</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 STATS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Completed Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{totalCompleted}</div>
          <p className="text-xs text-slate-500 mt-1">Total completed interviews</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Average Performance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            {avgScore > 0 ? `${avgScore}%` : 'N/A'}
          </div>
          <p className="text-xs text-emerald-400/80 mt-1">Rubric-weighted score</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Strongest Competency</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-white truncate">{strongestSkill}</div>
          <p className="text-xs text-slate-500 mt-1">Consistently high rubric rating</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Area to Improve</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-amber-300 truncate">{weakestSkill}</div>
          <p className="text-xs text-slate-500 mt-1">Target in your next session</p>
        </div>
      </div>

      {/* CHARTS & RECOMMENDATION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Improvement Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Score Improvement Over Time</h3>
              <p className="text-xs text-slate-400">Progression across completed mock interview sessions</p>
            </div>
            <div className="text-xs text-indigo-400 font-mono">0-100% Scale</div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
              <History className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No interview history yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Complete your first interview to visualize your score progression and skill metrics.
              </p>
              <Link
                href="/interviews/new"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition"
              >
                Start First Interview
              </Link>
            </div>
          )}
        </div>

        {/* Recommended Practice Session */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Next Practice</span>
            </div>
            <h3 className="text-lg font-bold text-white">Targeted Drill: {weakestSkill}</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Based on your previous answers, focusing on {weakestSkill} will deliver the highest score boost for upcoming senior interviews.
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Recommended Duration</span>
                <span className="text-slate-200 font-medium">20 mins • 5 Qs</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Interaction Mode</span>
                <span className="text-indigo-300 font-medium">Voice & Follow-Ups</span>
              </div>
            </div>
          </div>

          <Link
            href="/interviews/new"
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <span>Launch Recommended Drill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* RECENT SESSIONS TABLE */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Interview Sessions</h3>
            <p className="text-xs text-slate-400">Review your past mock sessions and open detailed performance reports</p>
          </div>
          <Link
            href="/history"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {interviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Target Role</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {interviews.slice(0, 5).map((interview) => (
                  <tr key={interview._id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-medium text-white">{interview.targetRole}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-300">{interview.interviewType}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          interview.difficulty === 'hard'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : interview.difficulty === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {interview.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          interview.state === 'completed'
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {interview.state.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {interview.overallScore !== undefined ? `${interview.overallScore}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {interview.state === 'completed' ? (
                        <Link
                          href={`/interviews/${interview._id}/report`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                        >
                          View Report <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/interviews/${interview._id}`}
                          className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                        >
                          Resume <PlayCircle className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No mock interviews conducted yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Get started by uploading your resume or directly configuring your target role.
            </p>
            <Link
              href="/interviews/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure Your First Interview</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
