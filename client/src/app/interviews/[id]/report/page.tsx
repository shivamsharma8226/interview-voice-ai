'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { InterviewItem, FinalReport, QAPair } from '@/lib/types';
import {
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [interview, setInterview] = useState<InterviewItem | null>(null);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [retrying, setRetrying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (id) {
      loadReport();
    }
  }, [id, user, authLoading]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReport(id);
      setInterview(data.interview);
      setReport(data.report);
      setQaPairs(data.qaPairs);

      // Default expand all questions
      const exp: Record<string, boolean> = {};
      data.qaPairs.forEach((pair) => {
        exp[pair.question._id] = true;
      });
      setExpandedQuestions(exp);
    } catch (err: any) {
      setError(err.message || 'Failed to load performance report');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleRetryWeak = async () => {
    try {
      setRetrying(true);
      const { newInterviewId } = await api.retryWeakQuestions(id);
      await api.startInterview(newInterviewId);
      router.push(`/interviews/${newInterviewId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to launch retry session');
      setRetrying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !interview || !report) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Compiling your comprehensive performance report...</p>
        </div>
      </div>
    );
  }

  const overall = report.overallScore;
  const ratingBadge =
    overall >= 80
      ? { label: 'Exceptional Hire Rating', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' }
      : overall >= 60
      ? { label: 'Strong Competency Baseline', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' }
      : { label: 'Needs Dedicated Preparation', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 print:py-0 print:px-0">
      {/* NAVIGATION & ACTION BUTTONS */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleRetryWeak}
            disabled={retrying}
            className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>Retry Weak Areas Drill</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Export / Print Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* REPORT SUMMARY HERO CARD */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ratingBadge.color}`}>
                {ratingBadge.label}
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {interview.interviewType} Interview • {interview.difficulty}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {interview.targetRole}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Conducted on {new Date(interview.completedAt || interview.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 px-6 py-4 rounded-2xl border border-slate-800 self-stretch sm:self-auto justify-center">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                {overall}
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                Overall Score / 100
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary Text */}
        <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800/80">
          <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold mb-2">
            Executive Performance Summary
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed font-normal">
            {report.performanceSummary}
          </p>
        </div>

        {/* Strong Points & Weak Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4" /> Strong Points Demonstrated
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              {report.strongPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <h4 className="font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4" /> Weak Areas to Refine
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              {report.weakAreas.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resume Credibility Assessment */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-0.5">Resume Credibility Analysis</h4>
            <p className="text-slate-400 leading-relaxed">{report.resumeCredibilityFeedback}</p>
          </div>
        </div>
      </div>

      {/* SKILL SCORES BREAKDOWN CHART */}
      {report.skillScores && report.skillScores.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Competency Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Rubric-evaluated technical proficiency across tested skill domains
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.skillScores} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="skill" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {report.skillScores.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#6366f1' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* COMMUNICATION EVALUATION */}
      {report.communicationFeedback && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-400" />
            <span>Communication & Delivery Feedback</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-bold text-white">{report.communicationFeedback.clarityScore}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Clarity & Articulation</div>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-bold text-white">{report.communicationFeedback.structureScore}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Logical Structuring</div>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
              <div className="text-2xl font-bold text-white">{report.communicationFeedback.concisenessScore}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Conciseness & Relevance</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-300 space-y-2">
            <div>
              <span className="text-emerald-400 font-semibold">Strengths: </span>
              {report.communicationFeedback.strengths.join(' ')}
            </div>
            <div>
              <span className="text-amber-400 font-semibold">Actionable Guidance: </span>
              {report.communicationFeedback.improvements.join(' ')}
            </div>
          </div>
        </div>
      )}

      {/* QUESTION BY QUESTION DEEP DIVE */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <span>Question-by-Question Deep Dive</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Review detailed rubric assessments, missing technical concepts, and benchmark improved answers.
          </p>
        </div>

        <div className="space-y-4">
          {qaPairs.map((pair, idx) => {
            const isExpanded = expandedQuestions[pair.question._id];
            const answer = pair.answer;
            const evalData = answer?.evaluation;
            const score = answer?.score ?? 0;

            const verdictColor =
              score >= 8
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : score >= 5
                ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

            return (
              <div
                key={pair.question._id}
                className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden transition"
              >
                {/* Accordion header */}
                <div
                  onClick={() => toggleQuestion(pair.question._id)}
                  className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">
                        {pair.question.questionText}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Skill: {pair.question.evaluationRubric?.targetSkill || 'Technical Depth'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border font-mono ${verdictColor}`}>
                      {score}/10
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Accordion body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-800/80 space-y-4 bg-slate-950/40 text-xs">
                    {/* Candidate Answer */}
                    <div>
                      <h5 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Candidate Answer Transcript:
                      </h5>
                      <p className="text-slate-300 italic bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                        "{answer?.transcript || '(No answer provided)'}"
                      </p>
                    </div>

                    {evalData && (
                      <>
                        {/* Evaluation Summary */}
                        <div>
                          <h5 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Rubric Evaluation:
                          </h5>
                          <p className="text-slate-200">{evalData.summary}</p>
                        </div>

                        {/* Missing Concepts */}
                        {evalData.missingConcepts.length > 0 && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            <span className="font-bold">Missing Technical Concepts: </span>
                            {evalData.missingConcepts.join(', ')}
                          </div>
                        )}

                        {/* Improved Benchmark Answer */}
                        <div>
                          <h5 className="font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Benchmark Model Answer:
                          </h5>
                          <p className="text-slate-200 bg-indigo-950/30 p-3.5 rounded-lg border border-indigo-500/30 leading-relaxed">
                            {evalData.improvedAnswer}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-DAY PERSONALIZED STUDY PLAN */}
      {report.studyPlan && report.studyPlan.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Personalized 7-Day Curriculum</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Daily practice plan designed to eliminate gaps identified during this interview.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.studyPlan.map((day) => (
              <div key={day.day} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-semibold">
                    Day {day.day}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">{day.focusTopic}</h4>
                <div className="text-[11px] text-slate-400 space-y-1">
                  {day.exercises.map((ex, i) => (
                    <p key={i}>• {ex}</p>
                  ))}
                </div>
                <p className="text-[10px] text-indigo-300 italic pt-1 border-t border-slate-800">
                  Key Takeaway: {day.keyTakeaway}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
