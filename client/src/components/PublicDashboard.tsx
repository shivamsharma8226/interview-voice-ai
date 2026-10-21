import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  FileText,
  Mic,
  BarChart3,
  Brain,
  Code2,
  Users,
  Layers,
  CheckCircle2,
  Target,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';

const STEPS = [
  { icon: FileText, title: 'Add your resume', copy: 'Give each practice session real context from your experience.' },
  { icon: Mic, title: 'Practise out loud', copy: 'Answer role-specific questions by voice, with follow-ups.' },
  { icon: BarChart3, title: 'Review and improve', copy: 'Get a scored report and a clear plan for the next attempt.' },
];

const FEATURES = [
  { icon: Brain, title: 'Resume-aware questions', copy: 'Questions probe the projects and claims on your resume, like a real interviewer would.' },
  { icon: MessageSquareText, title: 'Adaptive follow-ups', copy: 'Vague answers get a follow-up. Strong answers get a harder question.' },
  { icon: Target, title: 'Rubric-based scoring', copy: 'Every session is scored per competency so you see exactly where points are lost.' },
  { icon: ShieldCheck, title: 'Private by default', copy: 'Your resume and reports live in your account and are visible only to you.' },
];

const TRACKS = [
  { icon: Code2, title: 'Technical', copy: 'Data structures, APIs, debugging and trade-offs.' },
  { icon: Layers, title: 'System design', copy: 'Scale, reliability and architecture discussions.' },
  { icon: Users, title: 'Behavioral', copy: 'Leadership, conflict and ownership stories.' },
];

const SAMPLE_SKILLS: [string, number][] = [
  ['Problem solving', 82],
  ['Communication', 74],
  ['System design', 68],
  ['Edge-case recovery', 51],
];

const FAQ = [
  ['Do I need a resume to start?', 'No. A resume makes questions more specific, but you can also just pick a target role and difficulty.'],
  ['Is it voice only?', 'Voice is the main mode. You can review the full transcript and report after each session.'],
  ['How long is a session?', 'A typical session is around 20 minutes. You can end early and still get a report.'],
];

export default function PublicDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Hero + sample report preview */}
      <section className="public-dashboard rounded-3xl border border-[#E9E5DF] bg-white p-7 sm:p-12 shadow-[0_16px_45px_rgba(31,41,55,0.06)] overflow-hidden relative">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#F3E8FF] blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E9E5DF] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#6D28D9]">
              <Sparkles className="w-3.5 h-3.5" /> Your practice workspace
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-[#1F2937]">
              A calmer way to prepare for the interview that matters.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Sign in to upload a resume, start a voice practice session, and review focused feedback from each attempt.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-[#5B21B6]">
                Sign in to start practice <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center rounded-xl border border-[#E9E5DF] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F4F1ED]">
                Create an account
              </Link>
            </div>
          </div>

          {/* Static sample, clearly labelled: not real user data */}
          <div className="rounded-2xl border border-[#E9E5DF] bg-[#FAF8F5] p-5" aria-label="Sample report preview">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sample report</span>
              <span className="rounded-full bg-white border border-[#E9E5DF] px-2 py-0.5 text-[10px] font-medium text-slate-500">Preview</span>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-bold tracking-tight text-[#1F2937]">74%</span>
              <span className="pb-1.5 text-xs text-slate-500">overall · Backend Engineer</span>
            </div>
            <div className="mt-5 space-y-3">
              {SAMPLE_SKILLS.map(([skill, score]) => (
                <div key={skill}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#1F2937]">{skill}</span>
                    <span className="text-slate-500">{score}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#EBE7E1] overflow-hidden">
                    <div className="h-full rounded-full bg-[#6D28D9]" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-white border border-[#E9E5DF] p-3 text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-[#1F2937]">Next focus:</span> walk through failure cases before describing the happy path.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">How it works</h2>
        <p className="mt-1 text-sm text-slate-500">Three steps from first login to a plan for your next attempt.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map(({ icon: Icon, title, copy }, i) => (
            <div key={title} className="rounded-2xl border border-[#E9E5DF] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6D28D9]">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-slate-400">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#1F2937]">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">What you get</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-[#E9E5DF] bg-white p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#E9E5DF] text-[#6D28D9]">
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937]">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tracks */}
      <section className="rounded-3xl border border-[#E9E5DF] bg-[#FAF8F5] p-7 sm:p-9">
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">Practice the round you are facing</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TRACKS.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-[#E9E5DF] bg-white p-5">
              <Icon className="w-5 h-5 text-[#6D28D9]" />
              <h3 className="mt-3 text-sm font-semibold text-[#1F2937]">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
          {['Easy, medium and hard difficulty', 'Full transcript after each session', 'Progress chart across attempts'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6B7A40]" /> {t}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-bold tracking-tight text-[#1F2937]">Common questions</h2>
        <div className="mt-5 divide-y divide-[#E9E5DF] rounded-2xl border border-[#E9E5DF] bg-white">
          {FAQ.map(([q, a]) => (
            <div key={q} className="p-5">
              <h3 className="text-sm font-semibold text-[#1F2937]">{q}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl bg-[#1F2937] p-8 sm:p-10 text-center">
        <h2 className="landing-cta-title text-2xl font-bold tracking-tight">Ready for your first practice round?</h2>
        <p className="landing-cta-copy mt-2 text-sm">Create an account and start in a couple of minutes.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5B21B6]">
            Create an account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold landing-cta-title transition hover:bg-white/10">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
