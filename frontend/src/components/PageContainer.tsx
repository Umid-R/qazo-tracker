import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-surface-900 text-surface-100 px-5 py-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-5">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-2">
      <h1 className="text-3xl font-semibold mb-1">{title}</h1>
      {subtitle && <p className="text-surface-400 text-base">{subtitle}</p>}
    </header>
  );
}

export function LoadingState() {
  return (
    <div className="card p-6">
      <div className="text-center text-surface-400">Loading...</div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="card p-6 border-error-600/30">
      <div className="text-center text-error-400">{message}</div>
    </div>
  );
}
