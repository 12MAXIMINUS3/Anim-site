import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSeo } from '@/lib/seo';

export function StaticPage({
  title,
  description,
  intro,
  children,
}: {
  title: string;
  description: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  useSeo({ title, description });
  return (
    <>
      <PageHeader title={title} crumbs={[{ label: title }]} description={intro} />
      <div className="container-page py-12">
        <div className="prose-vault max-w-3xl">{children}</div>
      </div>
    </>
  );
}

export const LAST_UPDATED = 'October 1, 2026';
