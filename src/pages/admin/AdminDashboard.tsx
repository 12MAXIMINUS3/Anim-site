import { Link } from 'react-router-dom';
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { adminListOrders, getDashboardStats, getLowStock } from '@/services/admin';
import { useAsync } from '@/hooks/useAsync';
import { formatCurrency, formatDate } from '@/lib/format';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { OrderStatusBadge } from '@/components/account/OrderDetails';
import { AdminPageHeader } from './AdminLayout';

export default function AdminDashboard() {
  const stats = useAsync(getDashboardStats, []);
  const lowStock = useAsync(() => getLowStock(8), []);
  const recent = useAsync(() => adminListOrders({ status: '', search: '', page: 1, pageSize: 6 }), []);

  const cards = stats.data
    ? [
        { label: 'Total products', value: stats.data.totalProducts, sub: `${stats.data.activeProducts} active`, icon: Package, to: '/admin/products' },
        { label: 'Low-stock items', value: stats.data.lowStock, sub: 'At or below threshold', icon: AlertTriangle, to: '/admin/products' },
        { label: 'Open orders', value: stats.data.pendingOrders, sub: 'Pending / paid / processing', icon: ShoppingCart, to: '/admin/orders' },
        { label: 'Customers', value: stats.data.totalCustomers, sub: 'Registered accounts', icon: Users, to: '/admin/customers' },
      ]
    : [];

  return (
    <>
      <AdminPageHeader title="Dashboard" description="Store overview at a glance." />
      {stats.error ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.loading
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            : cards.map(({ label, value, sub, icon: Icon, to }) => (
                <Link key={label} to={to} className="card p-5 transition hover:border-nova-500/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink-300">{label}</p>
                    <Icon className="h-5 w-5 text-nova-400" aria-hidden="true" />
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-xs text-ink-400">{sub}</p>
                </Link>
              ))}
        </div>
      )}
      {stats.data && (
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-400">
          <DollarSign className="h-4 w-4" aria-hidden="true" /> Demo order volume (non-cancelled): {formatCurrency(stats.data.revenueDemo)}
        </p>
      )}

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5" aria-labelledby="recent-orders">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-orders" className="text-lg font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm text-nova-300 hover:text-pulse-300">View all</Link>
          </div>
          {recent.loading ? (
            <Skeleton className="h-40" />
          ) : recent.error ? (
            <ErrorState error={recent.error} onRetry={recent.reload} />
          ) : !recent.data?.items.length ? (
            <p className="py-6 text-sm text-ink-400">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-admin">
                <thead>
                  <tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col" className="text-right">Total</th></tr>
                </thead>
                <tbody>
                  {recent.data.items.map((o) => (
                    <tr key={o.id}>
                      <td><span className="font-medium text-white">{o.orderNumber}</span><br /><span className="text-xs text-ink-400">{formatDate(o.createdAt)}</span></td>
                      <td className="text-ink-300">{o.fullName}<br /><span className="text-xs text-ink-500">{o.email}</span></td>
                      <td><OrderStatusBadge status={o.status} /></td>
                      <td className="text-right text-white">{formatCurrency(o.total, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-5" aria-labelledby="low-stock">
          <h2 id="low-stock" className="mb-4 text-lg font-semibold">Low stock</h2>
          {lowStock.loading ? (
            <Skeleton className="h-40" />
          ) : lowStock.error ? (
            <ErrorState error={lowStock.error} onRetry={lowStock.reload} />
          ) : !lowStock.data?.length ? (
            <p className="py-6 text-sm text-ink-400">All active products are above their stock threshold.</p>
          ) : (
            <ul className="divide-y divide-ink-800">
              {lowStock.data.map((r) => (
                <li key={r.productId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/admin/products/${r.productId}/edit`} className="line-clamp-1 text-sm text-white hover:text-nova-200">{r.name}</Link>
                    <p className="text-xs text-ink-500">{r.sku}</p>
                  </div>
                  <span className={r.quantity === 0 ? 'text-sm font-semibold text-rose-300' : 'text-sm font-semibold text-amber-300'}>
                    {r.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
