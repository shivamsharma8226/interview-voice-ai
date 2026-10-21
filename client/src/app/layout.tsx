import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'InterviewAI — AI-Powered Mock Interview Platform',
  description:
    'Realistic, voice-enabled mock technical, HR, behavioral, and system design interviews powered by personalized resume intelligence and structured rubric scoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F5] text-[#1F2937] antialiased flex flex-col selection:bg-[#E9D5FF] selection:text-[#4C1D95]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
