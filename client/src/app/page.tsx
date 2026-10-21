'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import {
  Mic2,
  Sparkles,
  CheckCircle2,
  Brain,
  FileCheck2,
  Award,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Terminal,
  Volume2,
  Layers,
  Code2,
  Users2,
  BookOpen,
} from 'lucide-react';
import { AudioWaveform } from '@/components/AudioWaveform';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-transparent blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-xs font-medium text-indigo-300 shadow-sm shadow-indigo-500/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Voice-Powered • Resume Intelligence • Adaptive Rubrics</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Master Your Next Interview with a Realistic{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">
                AI Interviewer
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
              Upload your resume, select your target role, and experience realistic mock interviews with spoken questions, speech-to-text answers, adaptive follow-ups, and evidence-based rubric scoring.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href={user ? '/interviews/new' : '/register'}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-base shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>{user ? 'Configure New Interview' : 'Start Free Mock Interview'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#categories"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-base transition flex items-center justify-center gap-2"
              >
                Explore Categories
              </Link>
            </div>

            <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PDF & DOCX Parsing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Private Audio
              </span>
            </div>
          </div>

          {/* INTERACTIVE MOCK INTERVIEWER CARD PREVIEW */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="rounded-2xl p-[1px] bg-gradient-to-b from-indigo-500/30 via-slate-800/80 to-slate-900/50 shadow-2xl">
              <div className="bg-[#0b1120] rounded-2xl p-6 sm:p-8 backdrop-blur-xl border border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center relative">
                      <Mic2 className="w-6 h-6 text-indigo-400" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base flex items-center gap-2">
                        AI Interviewer Panel
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Senior Staff Engineer Persona
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Technical Deep Dive • System Design & Node.js</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Volume2 className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-slate-300 font-medium">Interviewer Speaking</span>
                    <AudioWaveform isActive={true} color="purple" barCount={8} />
                  </div>
                </div>

                <div className="my-6 space-y-4">
                  <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800">
                    <p className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-medium mb-1">
                      Question 2 of 5 • Technical Accuracy & Scalability
                    </p>
                    <p className="text-lg text-slate-100 font-medium leading-relaxed">
                      &quot;In your resume, you highlighted optimizing an asynchronous distributed ledger service. What specific cache invalidation strategy did you implement to prevent cache stampedes and ensure transaction consistency?&quot;
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                        Real-Time Speech Recognition Buffer
                      </h4>
                      <p className="text-sm text-slate-300 mt-0.5">
                        &quot;We implemented a Cache-Aside strategy with Redis connection pooling. For the stampede issue, we used distributed mutex locks so only one instance repopulates stale keys...&quot;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Brain className="w-3.5 h-3.5 text-violet-400" /> Rubric: Concept depth, Error handling, Evidence
                  </span>
                  <span className="text-indigo-400 font-medium">
                    Adaptive Follow-Up Ready: &quot;How would that behave if the Redis master failed?&quot;
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="py-20 bg-[#090d16]/70 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Engineered for Genuine Growth
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              A Complete Mock Interview Pipeline
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              Built from first principles to simulate actual hiring bars, avoiding generic boilerplate responses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Resume Intelligence</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your resume in PDF or DOCX. The engine extracts verifiable technical claims, projects, and technologies to formulate questions testing real-world depth.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-violet-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-5">
                <Mic2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Natural Voice Interaction</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hear questions spoken naturally. Speak answers through your microphone with real-time speech transcription, editable draft buffers, or seamless text fallback.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Adaptive Follow-Up Probing</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                If an answer is brief or misses edge cases, the AI interviewer dynamically probes deeper into trade-offs and disaster recovery, exactly like a principal engineer.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-5">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Objective Rubric Scoring</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Each answer is graded across technical accuracy, reasoning, communication structure, and missing concepts. Scores are strictly evidence-backed.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-5">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Personalized 7-Day Study Plan</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Receive an actionable curriculum targeting your exact weak areas, complete with hands-on coding exercises, design trade-offs, and behavioral rehearsals.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Targeted Weak Areas Retry</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Immediately spin up a focused practice drill isolating questions where you scored below standard, cementing concepts through deliberate practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Clear 4-Step Workflow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              How InterviewAI Prepares You
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="text-4xl font-extrabold font-mono text-slate-800 absolute top-4 right-4">01</span>
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">1. Upload Resume</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop your PDF or Word resume. Our server extracts verified skills, projects, and career milestones.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="text-4xl font-extrabold font-mono text-slate-800 absolute top-4 right-4">02</span>
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center mb-4">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">2. Customize Session</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose target role (e.g. Senior Frontend), category, experience level, difficulty, and focus skills.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="text-4xl font-extrabold font-mono text-slate-800 absolute top-4 right-4">03</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
                <Mic2 className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">3. Speak Your Answers</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hear questions, speak naturally with real-time transcription, and tackle adaptive follow-up challenges.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="text-4xl font-extrabold font-mono text-slate-800 absolute top-4 right-4">04</span>
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">4. Review Analysis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get overall & skill-by-skill ratings, model benchmark answers, communication advice, and a 7-day plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-20 bg-[#090d16]/70 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              Comprehensive Coverage
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Supported Interview Formats
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Technical Interview',
                desc: 'Core data structures, concurrency, language runtime internals, and API design.',
                icon: Terminal,
                tag: 'High Demand',
              },
              {
                title: 'System Design',
                desc: 'Scalability, microservices, database sharding, caching layers, and high availability.',
                icon: Layers,
                tag: 'Senior / Staff',
              },
              {
                title: 'Full-Stack Developer',
                desc: 'End-to-end architecture, frontend state, REST/GraphQL APIs, and database migrations.',
                icon: Code2,
                tag: 'Generalist',
              },
              {
                title: 'Behavioral & STAR',
                desc: 'Conflict resolution, leadership impact, technical disagreements, and ownership stories.',
                icon: Users2,
                tag: 'Culture Fit',
              },
              {
                title: 'HR & Screening',
                desc: 'Career trajectory, motivation, team communication, and salary expectations guidance.',
                icon: CheckCircle2,
                tag: 'Screening',
              },
              {
                title: 'Custom Role',
                desc: 'Paste any custom job description to simulate targeted questions from hiring managers.',
                icon: Sparkles,
                tag: 'Adaptive',
              },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {cat.tag}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white mb-1.5">{cat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-indigo-900/50 via-slate-900 to-violet-950/40 border border-indigo-500/30 text-center space-y-6 relative">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2">
              <Mic2 className="w-8 h-8" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Practice Your Next Interview?
            </h3>
            <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
              Step into the interview room with genuine confidence. Get detailed scoring, pinpoint your blind spots, and rehearse your answers before the real meeting.
            </p>
            <div className="pt-2">
              <Link
                href={user ? '/interviews/new' : '/register'}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 transition"
              >
                <span>{user ? 'Configure Your Practice Session' : 'Get Started Now — It’s Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">InterviewAI</span>
            <span>• Production-Oriented AI Interview Platform</span>
          </div>
          <div>
            <span>Built with Next.js, Express, MongoDB & Browser Speech Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
