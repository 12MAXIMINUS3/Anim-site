import { useSearchParams } from 'react-router-dom';
import { useSeo } from '@/lib/seo';
import { CatalogView } from '@/components/product/CatalogView';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBox } from '@/components/layout/SearchBox';
import { EmptyState } from '@/components/ui/States';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const page = Math.max(1, Number(params.get('page')) || 1);

  useSeo({ title: q ? `Search: ${q}` : 'Search', noIndex: true });

  return (
    <>
      <PageHeader
        title={q ? `Results for “${q}”` : 'Search the vault'}
        crumbs={[{ label: 'Search' }]}
      >
        <SearchBox className="mt-6 max-w-xl" />
      </PageHeader>
      <div className="container-page py-10">
        {q ? (
          <CatalogView basePath="/search" pageMode="query" page={page} />
        ) : (
          <EmptyState title="What are you looking for?" description="Search by character, series, brand, scale or SKU." />
        )}
      </div>
    </>
  );
}
