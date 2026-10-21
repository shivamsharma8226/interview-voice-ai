import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Resume } from '../src/models/Resume.js';
import { Interview } from '../src/models/Interview.js';
import { InterviewQuestion } from '../src/models/InterviewQuestion.js';
import { InterviewAnswer } from '../src/models/InterviewAnswer.js';

const app = createApp();

describe('InterviewAI 16-Step End-to-End User Journey Audit', () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  let pdfResumeId: string;
  let docxResumeId: string;
  let interviewId: string;

  const pdfPath = '/tmp/test_alex_resume.pdf';
  const docxPath = '/tmp/test_morgan_resume.docx';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://127.0.0.1:27017/interviewai_e2e_test');
    }

    // Generate compliant uncompressed PDF test resume
    const { execSync } = await import('child_process');
    const ps = `%!PS
/Helvetica findfont 12 scalefont setfont
50 720 moveto (Alex Mercer - Senior Full-Stack Engineer) show
50 695 moveto (Experience: 6 years) show
50 670 moveto (Skills: React, Node.js, TypeScript, PostgreSQL, Redis, Docker, System Design) show
50 645 moveto (Projects: High-Throughput Fintech Engine with TypeScript and Redis) show
50 620 moveto (Employment: Lead Engineer at CloudScale Technologies) show
50 595 moveto (Education: Bachelor of Science in Computer Science) show
showpage
`;
    fs.writeFileSync('/tmp/test_alex_ps.ps', ps);
    execSync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.3 -dCompressPages=false -dNOPAUSE -dBATCH -sOutputFile=${pdfPath} /tmp/test_alex_ps.ps`);
  });

  afterAll(async () => {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    } catch {}
  });

  // STEP 1: Register a new user
  it('Step 1: Register a new candidate (Alex Mercer)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex Mercer',
        email: 'alex.mercer.e2e@example.com',
        password: 'SecurePassword123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.name).toBe('Alex Mercer');
    user1Token = res.body.data.token;
    user1Id = res.body.data.user.id;
  });

  // STEP 2: Log in
  it('Step 2: Log in with credentials and verify session profile', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.mercer.e2e@example.com',
        password: 'SecurePassword123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
    user1Token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('alex.mercer.e2e@example.com');
  });

  // STEP 3: Upload real test PDF resume
  it('Step 3: Upload real PDF resume file via multipart/form-data', async () => {
    expect(fs.existsSync(pdfPath)).toBe(true);

    const res = await request(app)
      .post('/api/resumes')
      .set('Authorization', `Bearer ${user1Token}`)
      .attach('resume', pdfPath);

    if (res.status !== 201) {
      console.log('STEP 3 FAILED WITH STATUS:', res.status, 'BODY:', res.body);
    }
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resume.originalFilename).toBe('test_alex_resume.pdf');
    expect(res.body.data.resume.processingStatus).toBe('completed');
    pdfResumeId = res.body.data.resume._id;
  });

  // STEP 4: Upload DOCX resume
  it('Step 4: Upload real DOCX resume file via multipart/form-data', async () => {
    expect(fs.existsSync(docxPath)).toBe(true);

    const res = await request(app)
      .post('/api/resumes')
      .set('Authorization', `Bearer ${user1Token}`)
      .attach('resume', docxPath);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resume.originalFilename).toBe('test_morgan_resume.docx');
    docxResumeId = res.body.data.resume._id;
  });

  // STEP 5: Verify extracted skills, projects, and experience
  it('Step 5: Verify extracted profile contains verified skills, projects, and level', async () => {
    const res = await request(app)
      .get(`/api/resumes/${pdfResumeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    const profile = res.body.data.resume.parsedProfile;
    expect(profile).toBeDefined();
    expect(profile.skills.length).toBeGreaterThanOrEqual(3);
    expect(profile.skills.some((s: any) => s.name === 'React')).toBe(true);
    expect(profile.skills.some((s: any) => s.name === 'Node.js')).toBe(true);
    expect(profile.skills.some((s: any) => s.name === 'TypeScript')).toBe(true);
    expect(profile.experienceLevel).toBe('senior');
    expect(profile.projects.length).toBeGreaterThanOrEqual(1);
  });

  // STEP 6: Edit the extracted candidate profile
  it('Step 6: Edit extracted profile (add skill and refine project claims)', async () => {
    const getRes = await request(app)
      .get(`/api/resumes/${pdfResumeId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    const existingProfile = getRes.body.data.resume.parsedProfile;
    existingProfile.targetSkills.push('GraphQL', 'Next.js');
    existingProfile.skills.push({
      name: 'GraphQL',
      evidence: 'Candidate manually verified production schema design',
      confidence: 1.0,
    });

    const patchRes = await request(app)
      .patch(`/api/resumes/${pdfResumeId}/profile`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send(existingProfile);

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.resume.parsedProfile.targetSkills).toContain('GraphQL');
  });

  // STEP 7: Configure a Node.js + React mock interview
  it('Step 7: Configure a Node.js + React mock interview session', async () => {
    const res = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        resumeId: pdfResumeId,
        targetRole: 'Senior Full-Stack Engineer (Node.js & React)',
        experienceLevel: 'senior',
        interviewType: 'technical',
        difficulty: 'hard',
        configuration: {
          durationMinutes: 20,
          totalQuestions: 2,
          focusSkills: ['Node.js', 'React', 'Redis', 'System Design'],
          allowFollowUps: true,
          voiceMode: true,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.interview.state).toBe('created');
    expect(res.body.data.interview.targetRole).toContain('Node.js & React');
    interviewId = res.body.data.interview._id;
  });

  // STEP 8: Start the interview
  it('Step 8: Start the interview and transition state to asking', async () => {
    const res = await request(app)
      .post(`/api/interviews/${interviewId}/start`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.interview.state).toBe('asking');
    expect(res.body.data.currentQuestion).toBeDefined();
    expect(res.body.data.currentQuestion.questionText.length).toBeGreaterThan(15);
  });

  // STEP 9 & 10: Answer questions and verify next question and follow-up logic
  it('Step 9 & 10: Submit text answer and trigger adaptive follow-up probing', async () => {
    // Get active question
    const intRes = await request(app)
      .get(`/api/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    const q1 = intRes.body.data.currentQuestion;

    // Provide an answer with foundational concepts but leaving out edge cases
    const ansRes = await request(app)
      .post(`/api/interviews/${interviewId}/answers`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        questionId: q1._id,
        transcript: 'We handle async operations using Promises and async/await syntax with try/catch blocks.',
        durationSeconds: 22,
      });

    expect(ansRes.status).toBe(200);
    expect(ansRes.body.data.isCompleted).toBe(false);
    // Since answer was concise, follow-up probing was triggered
    expect(ansRes.body.data.isFollowUp).toBe(true);
    expect(ansRes.body.data.nextQuestion.questionText).toBeDefined();
  });

  // STEP 11: Pause and resume the session
  it('Step 11: Pause and resume the live interview session', async () => {
    const pauseRes = await request(app)
      .post(`/api/interviews/${interviewId}/pause`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.interview.state).toBe('paused');

    const resumeRes = await request(app)
      .post(`/api/interviews/${interviewId}/resume`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.interview.state).toBe('asking');
  });

  // STEP 12: Finish the interview
  it('Step 12: Answer remaining questions and complete the interview session', async () => {
    let completed = false;
    let loopCount = 0;

    while (!completed && loopCount < 8) {
      loopCount++;
      const answers = await InterviewAnswer.find({ interviewId });
      const answeredIds = answers.map((a) => a.questionId.toString());

      const pendingQ = await InterviewQuestion.findOne({
        interviewId,
        _id: { $nin: answeredIds },
      }).sort({ order: 1 });

      if (!pendingQ) break;

      const submitRes = await request(app)
        .post(`/api/interviews/${interviewId}/answers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          questionId: pendingQ._id.toString(),
          transcript:
            'In our production deployment, we architected a Cache-Aside pattern with Redis clusters, connection pooling, and circuit breakers. We handled cache stampedes using distributed locks and TTL jitter, ensuring ACID consistency with rollback compensation hooks.',
          durationSeconds: 48,
        });

      expect(submitRes.status).toBe(200);
      if (submitRes.body.data.isCompleted) {
        completed = true;
      }
    }

    const checkRes = await request(app)
      .get(`/api/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(checkRes.body.data.interview.state).toBe('completed');
  });

  // STEP 13 & 14: Open final feedback report and verify scores, mistakes, missing concepts, study plan
  it('Step 13 & 14: Open final feedback report and verify rubric scores and 7-day study plan', async () => {
    const res = await request(app)
      .get(`/api/interviews/${interviewId}/report`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    const { report, qaPairs } = res.body.data;

    expect(report.overallScore).toBeGreaterThanOrEqual(50);
    expect(report.performanceSummary.length).toBeGreaterThan(20);
    expect(report.skillScores.length).toBeGreaterThanOrEqual(1);
    expect(report.communicationFeedback.clarityScore).toBeGreaterThan(0);
    expect(report.communicationFeedback.structureScore).toBeGreaterThan(0);
    expect(report.communicationFeedback.concisenessScore).toBeGreaterThan(0);
    expect(report.studyPlan.length).toBe(7);

    // Verify QA Pairs have rubric evaluations, benchmark answers, and missing concepts
    expect(qaPairs.length).toBeGreaterThanOrEqual(2);
    const answeredPair = qaPairs.find((p: any) => p.answer !== null);
    expect(answeredPair).toBeDefined();
    expect(answeredPair.answer.evaluation.improvedAnswer).toBeDefined();
    expect(answeredPair.answer.evaluation.summary).toBeDefined();
  });

  // STEP 15: Open interview history and reload saved session
  it('Step 15: Open interview history and reload completed session', async () => {
    const res = await request(app)
      .get('/api/interviews')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.interviews.length).toBeGreaterThanOrEqual(1);

    const session = res.body.data.interviews.find((i: any) => i._id === interviewId);
    expect(session).toBeDefined();
    expect(session.state).toBe('completed');
    expect(session.overallScore).toBeDefined();
  });

  // STEP 16: Verify that a second user cannot access the first user's data (Cross-user isolation)
  it('Step 16: Verify that User 2 cannot view or tamper with User 1 resume or interview', async () => {
    // Register User 2
    const u2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Eve Intruder',
        email: 'eve.intruder@example.com',
        password: 'Password123!',
      });

    expect(u2Res.status).toBe(201);
    user2Token = u2Res.body.data.token;
    user2Id = u2Res.body.data.user.id;

    // User 2 attempts to read User 1's resume
    const resumeAccess = await request(app)
      .get(`/api/resumes/${pdfResumeId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(resumeAccess.status).toBe(404);

    // User 2 attempts to read User 1's interview
    const interviewAccess = await request(app)
      .get(`/api/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(interviewAccess.status).toBe(404);

    // User 2 attempts to read User 1's performance report
    const reportAccess = await request(app)
      .get(`/api/interviews/${interviewId}/report`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(reportAccess.status).toBe(404);

    // User 2 attempts to delete User 1's interview
    const deleteAttempt = await request(app)
      .delete(`/api/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(deleteAttempt.status).toBe(404);

    // User 1's interview still exists safely
    const verifyExists = await request(app)
      .get(`/api/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(verifyExists.status).toBe(200);
  });
});
