import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { CatalogView } from '@/components/product/CatalogView';
import { PageHeader } from '@/components/layout/PageHeader';
import { useSeo } from '@/lib/seo';

export default function ShopPage() {
  const { page: pageParam } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const page = pageParam ? Number(pageParam) : 1;

  const sale = params.get('sale') === '1';
  const newest = params.get('sort') === 'newest';
  const franchises = params.getAll('franchise');
  const series = franchises.length === 1 ? franchises[0] : null;
  const title = series ? `${series} Figures` : sale ? 'Sale' : newest ? 'New Arrivals' : 'Shop All Collectibles';

  useSeo({
    title: page > 1 ? `${title} — Page ${page}` : title,
    description: 'Browse every scale figure, statue, chibi mini, action figure and display accessory in the Nova Figure Vault catalog.',
  });

  if (pageParam !== undefined && (!Number.isInteger(page) || page < 1)) return <Navigate to="/shop" replace />;
  if (page === 1 && pageParam !== undefined) return <Navigate to={`/shop${location.search}`} replace />;

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[{ label: 'Shop', to: '/shop' }, ...(page > 1 ? [{ label: `Page ${page}` }] : [])]}
        description={series ? `Figures, statues and collectibles from ${series}.` : sale ? 'Marked-down pieces while stock lasts.' : 'Original figures, statues and display gear — filter by series, scale, brand and more.'}
      />
      <div className="container-page py-10">
        <CatalogView basePath="/shop" pageMode="path" page={page} />
      </div>
    </>
  );
}
