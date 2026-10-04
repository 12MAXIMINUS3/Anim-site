import { useParams, useSearchParams } from 'react-router-dom';
import { catalog } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { useSeo } from '@/lib/seo';
import { CatalogView } from '@/components/product/CatalogView';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState, Spinner } from '@/components/ui/States';
import NotFoundPage from './NotFoundPage';

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { data: categories, loading, error, reload } = useAsync(() => catalog.listCategories(), []);
  const category = categories?.find((c) => c.slug === slug);

  useSeo({
    title: category ? (page > 1 ? `${category.name} — Page ${page}` : category.name) : 'Collection',
    description: category?.description ?? undefined,
    image: category?.imageUrl ?? undefined,
  });

  if (loading) return <Spinner label="Loading collection" className="py-32" />;
  if (error) return <div className="container-page py-16"><ErrorState error={error} onRetry={reload} /></div>;
  if (!category) return <NotFoundPage message="That collection doesn’t exist or is no longer available." />;

  return (
    <>
      <PageHeader title={category.name} description={category.description} crumbs={[{ label: 'Shop', to: '/shop' }, { label: category.name }]} />
      <div className="container-page py-10">
        <CatalogView key={slug} basePath={`/category/${slug}`} pageMode="query" page={page} fixedCategorySlug={slug} />
      </div>
    </>
  );
}
