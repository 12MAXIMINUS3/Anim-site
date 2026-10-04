import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { adminListCustomers, setUserRole } from '@/services/admin';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { AdminPageHeader } from './AdminLayout';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 20;

export default function AdminCustomers() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const list = useAsync(() => adminListCustomers({ search: debounced, page, pageSize: PAGE_SIZE }), [debounced, page]);
  const pageCount = Math.max(1, Math.ceil((list.data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Customers" description={list.data ? `${list.data.total} accounts` : undefined} />
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        <label htmlFor="customer-search" className="sr-only">Search customers</label>
        <input id="customer-search" className="input pl-9" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.loading && !list.data ? (
        <Spinner />
      ) : !list.data?.items.length ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className={cn('card overflow-x-auto', list.loading && 'opacity-60')}>
          <table className="table-admin min-w-[720px]">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Phone</th>
                <th scope="col">Joined</th>
                <th scope="col">Orders</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium text-white">{c.fullName || '—'}</p>
                    <p className="text-xs text-ink-500">{c.email}</p>
                  </td>
                  <td className="text-ink-300">{c.phone || '—'}</td>
                  <td className="text-ink-300">{formatDate(c.createdAt)}</td>
                  <td className="text-ink-300">{c.orderCount}</td>
                  <td>
                    <label htmlFor={`role-${c.id}`} className="sr-only">Role for {c.email}</label>
                    <select
                      id={`role-${c.id}`}
                      className="input w-auto py-1.5 text-xs"
                      value={c.role}
                      disabled={c.id === user?.id}
                      title={c.id === user?.id ? 'You cannot change your own role' : undefined}
                      onChange={async (e) => {
                        const role = e.target.value as 'customer' | 'admin';
                        if (!window.confirm(`Change ${c.email} to ${role}?`)) return;
                        try {
                          await setUserRole(c.id, role);
                          toast.success('Role updated');
                          list.reload();
                        } catch (err) {
                          toast.error('Could not change role', friendlyError(err));
                        }
                      }}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={(n) => (n > 1 ? `/admin/customers?page=${n}` : '/admin/customers')} />
    </>
  );
}
