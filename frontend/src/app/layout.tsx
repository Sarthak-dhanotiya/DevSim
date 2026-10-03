import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OnboardingGate } from '@/components/auth/OnboardingGate';

export const metadata: Metadata = {
  title: 'DevSim | Virtual Software Company Platform',
  description:
    'Gain real-world software industry engineering experience before your first job. Work on production-grade codebases in simulated tech companies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1"><OnboardingGate>{children}</OnboardingGate></main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
