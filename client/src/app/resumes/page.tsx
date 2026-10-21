'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { ResumeItem, CandidateProfile } from '@/lib/types';
import {
  Upload,
  FileText,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  X,
  PlayCircle,
} from 'lucide-react';

export default function ResumesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Edit Modal State
  const [editingProfile, setEditingProfile] = useState<CandidateProfile | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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
      if (data.resumes.length > 0) {
        setSelectedResume(data.resumes[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);
    setUploading(true);

    try {
      const { resume } = await api.uploadResume(file);
      setResumes([resume, ...resumes]);
      setSelectedResume(resume);
      setSuccessMsg(`Resume "${file.name}" analyzed successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await api.deleteResume(id);
      const updated = resumes.filter((r) => r._id !== id);
      setResumes(updated);
      if (selectedResume?._id === id) {
        setSelectedResume(updated[0] || null);
      }
      setSuccessMsg('Resume deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume');
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedResume || !editingProfile) return;

    setSavingEdit(true);
    try {
      const { resume } = await api.updateResumeProfile(selectedResume._id, editingProfile);
      setSelectedResume(resume);
      setResumes(resumes.map((r) => (r._id === resume._id ? resume : r)));
      setEditingProfile(null);
      setSuccessMsg('Candidate profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim() || !editingProfile) return;
    const updatedSkills = [
      ...editingProfile.skills,
      { name: newSkillName.trim(), evidence: 'User manually specified', confidence: 1.0 },
    ];
    setEditingProfile({
      ...editingProfile,
      skills: updatedSkills,
      targetSkills: Array.from(new Set([...editingProfile.targetSkills, newSkillName.trim()])),
    });
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillName: string) => {
    if (!editingProfile) return;
    setEditingProfile({
      ...editingProfile,
      skills: editingProfile.skills.filter((s) => s.name !== skillName),
      targetSkills: editingProfile.targetSkills.filter((s) => s !== skillName),
    });
  };

  if (authLoading || (loading && !resumes.length)) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const profile = selectedResume?.parsedProfile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Resume Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload resumes in PDF or DOCX. The AI extracts verifiable skills, projects, and generates targeted questions.
          </p>
        </div>

        {selectedResume && (
          <button
            onClick={() => router.push(`/interviews/new?resumeId=${selectedResume._id}`)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Practice with this Resume</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* UPLOAD DRAG-AND-DROP PANEL */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 border-dashed hover:border-indigo-500/50 transition">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center mb-3">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <span className="text-sm font-semibold text-white">
            {uploading ? 'Analyzing Resume & Extracting Profile...' : 'Click to Upload Resume or Drag & Drop'}
          </span>
          <span className="text-xs text-slate-400 mt-1">PDF or DOCX documents up to 10MB</span>
          <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict data isolation • Private server-side extraction • Temporary files cleaned</span>
          </div>
          <input
            type="file"
            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={uploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* RESUME SELECTION LIST & DETAILS */}
      {resumes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Uploaded Resumes List */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Uploaded Resumes ({resumes.length})
            </h3>

            <div className="space-y-2 mt-3">
              {resumes.map((resume) => {
                const isSelected = selectedResume?._id === resume._id;
                return (
                  <div
                    key={resume._id}
                    onClick={() => setSelectedResume(resume)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileText className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <p className="text-xs font-medium truncate text-slate-200">{resume.originalFilename}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(resume.createdAt).toLocaleDateString()} •{' '}
                          <span className="capitalize">{resume.parsedProfile?.experienceLevel || 'Mid-Level'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResume(resume._id);
                      }}
                      title="Delete resume"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Extracted Profile Details & Correct Information Button */}
          {profile && selectedResume ? (
            <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      Extracted Candidate Profile
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 capitalize">
                      {profile.experienceLevel} Level
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedResume.originalFilename}</h2>
                </div>

                <button
                  onClick={() => setEditingProfile(JSON.parse(JSON.stringify(profile)))}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Correct Profile Details</span>
                </button>
              </div>

              {/* Skills Grid */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Verified Skills & Evidence ({profile.skills.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profile.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">{skill.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {Math.round(skill.confidence * 100)}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic">{skill.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              {profile.projects.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Extracted Projects & Claims to Verify
                  </h4>
                  <div className="space-y-3">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-indigo-300">{proj.name}</h5>
                          <div className="flex flex-wrap gap-1">
                            {proj.technologies.map((t, ti) => (
                              <span
                                key={ti}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300">{proj.description}</p>
                        {proj.claimsToVerify.length > 0 && (
                          <div className="text-[11px] text-slate-400 pt-1">
                            <span className="text-violet-400 font-medium">Claims targeted in interview: </span>
                            {proj.claimsToVerify.join(' • ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience & Education */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div>
                  <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Work History</h4>
                  {profile.experience.length > 0 ? (
                    profile.experience.map((exp, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/50 rounded-xl mb-2">
                        <p className="font-semibold text-white">{exp.role}</p>
                        <p className="text-slate-400 text-[11px]">
                          {exp.company} {exp.duration ? `• ${exp.duration}` : ''}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No formal employment entries extracted.</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Education</h4>
                  {profile.education.length > 0 ? (
                    profile.education.map((edu, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/50 rounded-xl mb-2">
                        <p className="font-semibold text-white">{edu.degree}</p>
                        <p className="text-slate-400 text-[11px]">
                          {edu.institution} {edu.year ? `• ${edu.year}` : ''}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No education entries extracted.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No resumes uploaded yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Upload your technical resume above to let our AI extract skills, projects, and formulate tailored interview questions.
          </p>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Correct Extracted Profile</span>
              </h3>
              <button
                onClick={() => setEditingProfile(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Experience Level Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['entry', 'mid-level', 'senior', 'lead'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEditingProfile({ ...editingProfile, experienceLevel: lvl })}
                    className={`py-2 text-xs font-medium rounded-xl border capitalize transition ${
                      editingProfile.experienceLevel === lvl
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills Tag Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Extracted Skills (Click ✕ to remove)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {editingProfile.skills.map((skill) => (
                  <span
                    key={skill.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Add skill (e.g. Next.js, Kubernetes, Redis)"
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

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50"
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save Corrections</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
