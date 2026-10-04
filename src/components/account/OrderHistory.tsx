import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Package } from 'lucide-react';
import type { Order } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { listMyOrders } from '@/services/account';
import { useAsync } from '@/hooks/useAsync';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { OrderStatusBadge, OrderDetails, orderBalance } from './OrderDetails';
import { cn } from '@/lib/cn';

export function OrderHistory() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => (user ? listMyOrders(user.id) : Promise.resolve([] as Order[])), [user?.id]);
  const [open, setOpen] = useState<string | null>(null);

  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data?.length) {
    return (
      <EmptyState
        icon={<Package className="h-7 w-7" aria-hidden="true" />}
        title="No orders yet"
        description="When you place an order it will appear here."
        action={<Link to="/shop" className="btn-primary">Start shopping</Link>}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((o) => {
        const isOpen = open === o.id;
        return (
          <li key={o.id} className="card overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : o.id)}
              className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 p-5 text-left hover:bg-ink-850"
            >
              <span className="min-w-[10rem]">
                <span className="block font-semibold text-white">{o.orderNumber}</span>
                <span className="block text-xs text-ink-400">{formatDate(o.createdAt)}</span>
              </span>
              <OrderStatusBadge status={o.status} />
              <span className="text-sm text-ink-300">
                {o.items.reduce((s, i) => s + i.quantity, 0)} item{o.items.reduce((s, i) => s + i.quantity, 0) === 1 ? '' : 's'}
              </span>
              <span className="ml-auto text-right">
                <span className="block font-semibold text-white">{formatCurrency(o.total, o.currency)}</span>
                {orderBalance(o) > 0 && o.status !== 'cancelled' && (
                  <span className="block text-xs text-orange-300">{formatCurrency(orderBalance(o), o.currency)} due</span>
                )}
              </span>
              <ChevronDown className={cn('h-5 w-5 text-ink-400 transition', isOpen && 'rotate-180')} aria-hidden="true" />
            </button>
            {isOpen && (
              <div className="border-t border-ink-800 p-5">
                <OrderDetails order={o} onPaid={reload} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
