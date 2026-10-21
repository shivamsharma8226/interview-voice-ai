import {
  User,
  ResumeItem,
  InterviewItem,
  InterviewQuestionItem,
  InterviewAnswerItem,
  FinalReport,
  CandidateProfile,
  QAPair,
} from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('interviewai_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if FormData is being sent
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      json.message || `API request failed with status ${res.status}`,
      res.status,
      json
    );
  }

  return json;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth<{ success: boolean; data: { token: string; user: User } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return res.data;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth<{ success: boolean; data: { token: string; user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetchWithAuth<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('interviewai_token');
    }
    await fetchWithAuth('/auth/logout', { method: 'POST' }).catch(() => {});
  },

  // Resumes
  async uploadResume(file: File): Promise<{ resume: ResumeItem }> {
    const formData = new FormData();
    formData.append('resume', file);

    const res = await fetchWithAuth<{ success: boolean; data: { resume: ResumeItem } }>('/resumes', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  async getResumes(): Promise<{ resumes: ResumeItem[] }> {
    const res = await fetchWithAuth<{ success: boolean; data: { resumes: ResumeItem[] } }>('/resumes');
    return res.data;
  },

  async getResumeById(id: string): Promise<{ resume: ResumeItem }> {
    const res = await fetchWithAuth<{ success: boolean; data: { resume: ResumeItem } }>(`/resumes/${id}`);
    return res.data;
  },

  async updateResumeProfile(id: string, profile: CandidateProfile): Promise<{ resume: ResumeItem }> {
    const res = await fetchWithAuth<{ success: boolean; data: { resume: ResumeItem } }>(`/resumes/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
    return res.data;
  },

  async deleteResume(id: string): Promise<void> {
    await fetchWithAuth(`/resumes/${id}`, { method: 'DELETE' });
  },

  // Interviews
  async createInterview(payload: {
    resumeId?: string;
    targetRole: string;
    experienceLevel: string;
    interviewType: string;
    difficulty: string;
    configuration: {
      durationMinutes: number;
      totalQuestions: number;
      focusSkills: string[];
      allowFollowUps: boolean;
      voiceMode: boolean;
      jobDescription?: string;
    };
  }): Promise<{ interview: InterviewItem; questionsCount: number; firstQuestion: InterviewQuestionItem }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: { interview: InterviewItem; questionsCount: number; firstQuestion: InterviewQuestionItem };
    }>('/interviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async getInterviews(params?: { category?: string; state?: string; page?: number; limit?: number }): Promise<{
    interviews: InterviewItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.state) query.append('state', params.state);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithAuth<{
      success: boolean;
      data: { interviews: InterviewItem[]; pagination: any };
    }>(`/interviews${queryString}`);
    return res.data;
  },

  async getInterviewById(id: string): Promise<{
    interview: InterviewItem;
    questions: InterviewQuestionItem[];
    answers: InterviewAnswerItem[];
    currentQuestion: InterviewQuestionItem | null;
  }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: {
        interview: InterviewItem;
        questions: InterviewQuestionItem[];
        answers: InterviewAnswerItem[];
        currentQuestion: InterviewQuestionItem | null;
      };
    }>(`/interviews/${id}`);
    return res.data;
  },

  async startInterview(id: string): Promise<{
    interview: InterviewItem;
    currentQuestion: InterviewQuestionItem;
    totalQuestions: number;
    currentIndex: number;
  }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: {
        interview: InterviewItem;
        currentQuestion: InterviewQuestionItem;
        totalQuestions: number;
        currentIndex: number;
      };
    }>(`/interviews/${id}/start`, { method: 'POST' });
    return res.data;
  },

  async submitAnswer(
    id: string,
    payload: { questionId: string; transcript: string; durationSeconds: number }
  ): Promise<{
    isCompleted: boolean;
    isFollowUp?: boolean;
    currentIndex?: number;
    totalQuestions?: number;
    nextQuestion?: InterviewQuestionItem;
    interviewId?: string;
    overallScore?: number;
  }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: {
        isCompleted: boolean;
        isFollowUp?: boolean;
        currentIndex?: number;
        totalQuestions?: number;
        nextQuestion?: InterviewQuestionItem;
        interviewId?: string;
        overallScore?: number;
      };
    }>(`/interviews/${id}/answers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async pauseInterview(id: string): Promise<{ interview: InterviewItem }> {
    const res = await fetchWithAuth<{ success: boolean; data: { interview: InterviewItem } }>(
      `/interviews/${id}/pause`,
      { method: 'POST' }
    );
    return res.data;
  },

  async resumeInterview(id: string): Promise<{ interview: InterviewItem; currentQuestion: InterviewQuestionItem }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: { interview: InterviewItem; currentQuestion: InterviewQuestionItem };
    }>(`/interviews/${id}/resume`, { method: 'POST' });
    return res.data;
  },

  async completeInterview(id: string): Promise<{ interviewId: string; overallScore: number; report: FinalReport }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: { interviewId: string; overallScore: number; report: FinalReport };
    }>(`/interviews/${id}/complete`, { method: 'POST' });
    return res.data;
  },

  async getReport(id: string): Promise<{ interview: InterviewItem; report: FinalReport; qaPairs: QAPair[] }> {
    const res = await fetchWithAuth<{
      success: boolean;
      data: { interview: InterviewItem; report: FinalReport; qaPairs: QAPair[] };
    }>(`/interviews/${id}/report`);
    return res.data;
  },

  async retryWeakQuestions(id: string): Promise<{ newInterviewId: string }> {
    const res = await fetchWithAuth<{ success: boolean; data: { newInterviewId: string } }>(
      `/interviews/${id}/retry-weak-questions`,
      { method: 'POST' }
    );
    return res.data;
  },

  async deleteInterview(id: string): Promise<void> {
    await fetchWithAuth(`/interviews/${id}`, { method: 'DELETE' });
  },

  // Engine status
  async getAIStatus(): Promise<{
    provider: string;
    model: string;
    isExternalKeyConfigured: boolean;
    isLocalFallbackActive: boolean;
  }> {
    const res = await fetchWithAuth<{ success: boolean; data: any }>('/ai/status');
    return res.data;
  },

  async getVoiceStatus(): Promise<{
    clientSpeechRecognitionSupported: boolean;
    clientSpeechSynthesisSupported: boolean;
    hasExternalSttKey: boolean;
    hasExternalTtsKey: boolean;
    preferredEngine: string;
  }> {
    const res = await fetchWithAuth<{ success: boolean; data: any }>('/voice/status');
    return res.data;
  },
};
