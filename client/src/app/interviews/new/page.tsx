'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ResumeItem } from '@/lib/types';
import {
  Mic2,
  FileText,
  PlayCircle,
  Sparkles,
  Layers,
  Terminal,
  Code2,
  Users2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react';

function NewInterviewContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultResumeId = searchParams.get('resumeId');

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(defaultResumeId || '');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid-level' | 'senior' | 'lead'>('senior');
  const [interviewType, setInterviewType] = useState<
    'technical' | 'hr' | 'behavioral' | 'system_design' | 'coding' | 'fullstack' | 'custom'
  >('technical');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [allowFollowUps, setAllowFollowUps] = useState<boolean>(true);
  const [voiceMode, setVoiceMode] = useState<boolean>(true);
  const [jobDescription, setJobDescription] = useState<string>('');

  const [focusSkills, setFocusSkills] = useState<string[]>(['TypeScript', 'Node.js', 'System Architecture']);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadResumes();
    }
  }, [user, authLoading, router]);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await api.getResumes();
      setResumes(data.resumes);
      if (defaultResumeId && data.resumes.some((r) => r._id === defaultResumeId)) {
        setSelectedResumeId(defaultResumeId);
        populateFromResume(data.resumes.find((r) => r._id === defaultResumeId)!);
      } else if (data.resumes.length > 0 && !selectedResumeId) {
        setSelectedResumeId(data.resumes[0]._id);
        populateFromResume(data.resumes[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const populateFromResume = (resume: ResumeItem) => {
    if (resume.parsedProfile) {
      setExperienceLevel(resume.parsedProfile.experienceLevel || 'mid-level');
      if (resume.parsedProfile.targetSkills?.length > 0) {
        setFocusSkills(resume.parsedProfile.targetSkills.slice(0, 5));
      }
    }
  };

  const handleResumeSelect = (id: string) => {
    setSelectedResumeId(id);
    const resume = resumes.find((r) => r._id === id);
    if (resume) {
      populateFromResume(resume);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!focusSkills.includes(newSkillInput.trim())) {
      setFocusSkills([...focusSkills, newSkillInput.trim()]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFocusSkills(focusSkills.filter((s) => s !== skill));
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const { interview } = await api.createInterview({
        resumeId: selectedResumeId || undefined,
        targetRole,
        experienceLevel,
        interviewType,
        difficulty,
        configuration: {
          durationMinutes,
          totalQuestions,
          focusSkills,
          allowFollowUps,
          voiceMode,
          jobDescription: interviewType === 'custom' ? jobDescription : undefined,
        },
      });

      // Start the interview and transition to the live room
      await api.startInterview(interview._id);
      router.push(`/interviews/${interview._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create interview session');
      setCreating(false);
    }
  };

  const categories = [
    { id: 'technical', label: 'Technical Interview', desc: 'Core logic, concurrency, language runtime, & database internals', icon: Terminal },
    { id: 'system_design', label: 'System Design', desc: 'Scalability, microservices, database sharding, & high availability', icon: Layers },
    { id: 'fullstack', label: 'Full-Stack Developer', desc: 'Frontend frameworks, backend services, caching, & state management', icon: Code2 },
    { id: 'behavioral', label: 'Behavioral & STAR', desc: 'Conflict resolution, ownership, trade-off arguments, & leadership', icon: Users2 },
    { id: 'coding', label: 'Coding & Architecture', desc: 'Algorithmic efficiency, clean code practices, & design patterns', icon: Sparkles },
    { id: 'custom', label: 'Custom Job Spec', desc: 'Target a specific job description with tailored questions', icon: SlidersHorizontal },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Configurable Simulation Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Configure Mock Interview</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tailor your mock interview session to match your upcoming hiring bar.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleStartInterview} className="space-y-6">
        {/* RESUME SELECTION */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Select Candidate Resume</span>
            </label>
            <span className="text-[11px] text-slate-400">Questions will be calibrated against resume claims</span>
          </div>

          {resumes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {resumes.map((resume) => {
                const isSelected = selectedResumeId === resume._id;
                return (
                  <div
                    key={resume._id}
                    onClick={() => handleResumeSelect(resume._id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 truncate">{resume.originalFilename}</p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {resume.parsedProfile?.experienceLevel || 'Mid-Level'} • {resume.parsedProfile?.skills.length || 0} skills
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>No resume uploaded. Interview will use general role requirements.</span>
              <button
                type="button"
                onClick={() => router.push('/resumes')}
                className="text-indigo-400 hover:underline font-medium"
              >
                Upload Resume First
              </button>
            </div>
          )}
        </div>

        {/* TARGET ROLE & EXPERIENCE LEVEL */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Target Job Role
            </label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer, Staff Backend Architect, DevOps Engineer"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Experience Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'entry', label: 'Entry Level', desc: '0 - 2 yrs' },
                { id: 'mid-level', label: 'Mid-Level', desc: '3 - 5 yrs' },
                { id: 'senior', label: 'Senior', desc: '5 - 8 yrs' },
                { id: 'lead', label: 'Lead / Staff', desc: '8+ yrs' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExperienceLevel(lvl.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    experienceLevel === lvl.id
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-200">{lvl.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INTERVIEW CATEGORY */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interview Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = interviewType === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setInterviewType(cat.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">{cat.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cat.desc}</p>
                </div>
              );
            })}
          </div>

          {interviewType === 'custom' && (
            <div className="pt-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Paste Job Description / Requirements
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities or tech stack to tailor questions..."
                className="w-full p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* DIFFICULTY, DURATION & QUESTIONS COUNT */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 text-xs font-medium rounded-xl border capitalize transition ${
                    difficulty === diff
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Target Duration
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[15, 20, 30].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDurationMinutes(dur)}
                  className={`py-2 text-xs font-medium rounded-xl border transition ${
                    durationMinutes === dur
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Question Count
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[3, 5, 8].map((qCount) => (
                <button
                  key={qCount}
                  type="button"
                  onClick={() => setTotalQuestions(qCount)}
                  className={`py-2 text-xs font-medium rounded-xl border transition ${
                    totalQuestions === qCount
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {qCount} Qs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOCUS SKILLS MULTI-TAG SELECTOR */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Focus Skills to Challenge
          </label>
          <div className="flex flex-wrap gap-2">
            {focusSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              placeholder="Add skill tag (e.g. GraphQL, PostgreSQL, Docker)"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* TOGGLES: ADAPTIVE FOLLOW-UPS & VOICE MODE */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Enable Adaptive Follow-Up Probing</p>
              <p className="text-xs text-slate-400 mt-0.5">
                AI interviewer will dynamically ask follow-ups if your answer misses key edge cases.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowFollowUps(!allowFollowUps)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                allowFollowUps ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  allowFollowUps ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-violet-400" />
                <span>Voice Interview Mode</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Interviewer questions spoken aloud + speech-to-text microphone transcription (typed fallback always available).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceMode(!voiceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                voiceMode ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  voiceMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={creating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-base transition shadow-xl shadow-indigo-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Preparing Tailored Interview Questions...</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              <span>Start Realistic Interview Session</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function NewInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <NewInterviewContent />
    </Suspense>
  );
}
