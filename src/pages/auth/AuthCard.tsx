import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="card p-7 sm:p-9">
          <Logo className="mb-8" />
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-300">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-ink-300">{footer}</div>}
      </div>
    </div>
  );
}
