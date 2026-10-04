import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSeo } from '@/lib/seo';
import { formatCurrency } from '@/lib/format';

interface SuccessState {
  total?: number;
  email?: string;
  paymentMethod?: string;
  itemCount?: number;
}

export default function OrderSuccessPage() {
  useSeo({ title: 'Order confirmed', noIndex: true });
  const { orderNumber = '' } = useParams();
  const { state } = useLocation() as { state: SuccessState | null };
  const { user } = useAuth();
  const pending = state?.paymentMethod === 'bank_transfer';

  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-xl p-8 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-extrabold">Thank you for your order!</h1>
        <p className="mt-3 text-ink-300">
          Your demo order has been created{pending ? ' and is pending payment confirmation' : ''}.
        </p>
        <div className="mt-6 rounded-2xl border border-ink-700 bg-ink-850 p-5">
          <p className="text-xs uppercase tracking-widest text-ink-400">Order number</p>
          <p className="mt-1 font-display text-2xl font-bold text-gradient">{orderNumber}</p>
          {state?.total !== undefined && (
            <p className="mt-2 text-sm text-ink-300">
              {state.itemCount ? `${state.itemCount} item${state.itemCount === 1 ? '' : 's'} · ` : ''}Total {formatCurrency(state.total)}
            </p>
          )}
        </div>
        {state?.email && <p className="mt-4 text-sm text-ink-400">A confirmation would be sent to {state.email} in a live store.</p>}
        <p className="mt-2 text-xs text-ink-500">This is a demo: no payment was charged and nothing will ship.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user && (
            <Link to="/account?tab=orders" className="btn-primary">
              View order history
            </Link>
          )}
          <Link to="/shop" className={user ? 'btn-secondary' : 'btn-primary'}>
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
