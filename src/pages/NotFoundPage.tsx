import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/seo';
import { SearchBox } from '@/components/layout/SearchBox';

export default function NotFoundPage({ message }: { message?: string }) {
  useSeo({ title: 'Page not found', noIndex: true });
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-8xl font-extrabold text-gradient sm:text-9xl">404</p>
      <h1 className="mt-4 text-3xl font-bold">This shelf is empty</h1>
      <p className="mt-3 max-w-md text-ink-300">{message ?? 'The page you’re looking for has moved, sold out of existence, or never existed.'}</p>
      <SearchBox className="mt-8 w-full max-w-md text-left" />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
        <Link to="/shop" className="btn-secondary">
          Browse the shop
        </Link>
      </div>
    </div>
  );
}
