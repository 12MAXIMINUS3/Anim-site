import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { adminListOrders, updateOrderStatus } from '@/services/admin';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { OrderDetails, OrderStatusBadge } from '@/components/account/OrderDetails';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { AdminPageHeader } from './AdminLayout';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 15;
const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function StatusSelect({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [saving, setSaving] = useState(false);
  return (
    <>
      <label htmlFor={`status-${order.id}`} className="sr-only">Status for order {order.orderNumber}</label>
      <select
        id={`status-${order.id}`}
        className="input w-auto py-1.5 text-xs"
        value={order.status}
        disabled={saving}
        onClick={(e) => e.stopPropagation()}
        onChange={async (e) => {
          const status = e.target.value as OrderStatus;
          setSaving(true);
          try {
            await updateOrderStatus(order.id, status);
            toast.success('Order updated', `${order.orderNumber} → ${ORDER_STATUS_LABELS[status]}`);
            onUpdated();
          } catch (err) {
            toast.error('Could not update order', friendlyError(err));
          } finally {
            setSaving(false);
          }
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
        ))}
      </select>
    </>
  );
}

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debounced = useDebounce(search, 350);
  const status = (params.get('status') ?? '') as OrderStatus | '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [open, setOpen] = useState<string | null>(null);
  const list = useAsync(() => adminListOrders({ status, search: debounced, page, pageSize: PAGE_SIZE }), [status, debounced, page]);
  const pageCount = Math.max(1, Math.ceil((list.data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Orders" description={list.data ? `${list.data.total} orders` : undefined} />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <input id="order-search" className="input pl-9" placeholder="Order number, email or name" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label htmlFor="order-status" className="sr-only">Filter by status</label>
        <select
          id="order-status"
          className="input"
          value={status}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('status', e.target.value);
            else next.delete('status');
            next.delete('page');
            setParams(next);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.loading && !list.data ? (
        <Spinner />
      ) : !list.data?.items.length ? (
        <EmptyState title="No orders found" description="Orders placed through checkout will appear here." />
      ) : (
        <ul className={cn('space-y-3', list.loading && 'opacity-60')}>
          {list.data.items.map((o) => {
            const isOpen = open === o.id;
            return (
              <li key={o.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.id)} className="flex min-w-[12rem] items-center gap-2 text-left">
                    <ChevronDown className={cn('h-4 w-4 text-ink-400 transition', isOpen && 'rotate-180')} aria-hidden="true" />
                    <span>
                      <span className="block font-semibold text-white">{o.orderNumber}</span>
                      <span className="block text-xs text-ink-400">{formatDate(o.createdAt)}</span>
                    </span>
                  </button>
                  <span className="min-w-[10rem] text-sm text-ink-300">
                    {o.fullName}
                    <br />
                    <span className="text-xs text-ink-500">{o.email}{o.userId ? '' : ' · guest'}</span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                  <span className="ml-auto font-semibold text-white">{formatCurrency(o.total, o.currency)}</span>
                  <StatusSelect order={o} onUpdated={list.reload} />
                </div>
                {isOpen && (
                  <div className="border-t border-ink-800 p-5">
                    {o.phone && <p className="mb-3 text-sm text-ink-400">Phone: {o.phone}</p>}
                    <OrderDetails order={o} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(n) => {
          const next = new URLSearchParams(params);
          if (n > 1) next.set('page', String(n));
          else next.delete('page');
          const s = next.toString();
          return `/admin/orders${s ? `?${s}` : ''}`;
        }}
      />
    </>
  );
}
