import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { CartLineItem } from './CartLineItem';
import { useUiStore } from '@/store/uiStore';
import { selectSubtotal, useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/pricing';
import { useSettings } from '@/context/SettingsContext';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const close = useUiStore((s) => s.closeCart);
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectSubtotal);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Your cart (${lines.reduce((s, l) => s + l.quantity, 0)})`}
      variant="right"
      footer={
        lines.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-300">Subtotal</span>
              <span className="font-display text-lg font-bold text-white">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            <p className="text-xs text-ink-400">Shipping, discounts and taxes are calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/cart" onClick={close} className="btn-secondary">
                View cart
              </Link>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  close();
                  navigate('/checkout');
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingBag className="mb-4 h-10 w-10 text-nova-400" aria-hidden="true" />
          <p className="font-semibold text-white">Your cart is empty</p>
          <p className="mt-1 text-sm text-ink-400">Find your next centerpiece in the vault.</p>
          <Link to="/shop" onClick={close} className="btn-primary mt-6">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-ink-800 bg-ink-850 p-3">
            <p className="text-xs text-ink-300">
              {remaining > 0 ? (
                <>
                  Add <strong className="text-white">{formatCurrency(remaining, settings.currency)}</strong> for free standard shipping
                </>
              ) : (
                <strong className="text-emerald-300">You’ve unlocked free standard shipping!</strong>
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-nova-500 to-pulse-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <ul className="divide-y divide-ink-800">
            {lines.map((l) => (
              <CartLineItem key={`${l.productId}:${l.variantId}`} line={l} compact onNavigate={close} />
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}
