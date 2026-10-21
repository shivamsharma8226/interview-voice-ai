import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interview Room — InterviewAI',
};

/**
 * Interview room layout — NO navbar, NO padding.
 * The page itself renders a fixed full-screen overlay.
 */
export default function InterviewRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
