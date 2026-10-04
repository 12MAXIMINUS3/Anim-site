import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarClock, CreditCard, Landmark, Lock, ShoppingBag, Wallet } from 'lucide-react';
import { selectSubtotal, useCartStore } from '@/store/cartStore';
import {
  computeTotals,
  dueToday,
  INSTALLMENT_COUNT,
  installmentSchedule,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  type PaymentMethodId,
  type PaymentPlanId,
  type ShippingMethodId,
} from '@/lib/pricing';
import { addressFields, emailSchema, phoneSchema } from '@/lib/schemas';
import { COUNTRIES } from '@/lib/countries';
import { formatCurrency, formatDate } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSeo } from '@/lib/seo';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCartRefresh } from '@/hooks/useCartRefresh';
import { placeOrder } from '@/services/orders';
import { listAddresses, saveAddress } from '@/services/account';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderSummary } from '@/components/product/OrderSummary';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Field, FormAlert } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/States';
import { SetupRequired } from '@/components/ui/SetupRequired';
import { cn } from '@/lib/cn';

const schema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  ...addressFields,
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  paymentMethod: z.enum(['demo_card', 'demo_wallet', 'bank_transfer']),
  paymentPlan: z.enum(['full', 'installments']),
  notes: z.string().max(500, 'Keep notes under 500 characters').optional(),
  saveAddress: z.boolean(),
  acknowledgeDemo: z.boolean().refine((v) => v, 'Please confirm you understand this is a demo checkout'),
});
type CheckoutValues = z.infer<typeof schema>;

const PAYMENT_ICONS: Record<PaymentMethodId, typeof CreditCard> = {
  demo_card: CreditCard,
  demo_wallet: Wallet,
  bank_transfer: Landmark,
};

export default function CheckoutPage() {
  useSeo({ title: 'Checkout', noIndex: true });
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectSubtotal);
  const promoCode = useCartStore((s) => s.promoCode);
  const clearCart = useCartStore((s) => s.clear);
  const refreshing = useCartRefresh();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      shippingMethod: 'standard',
      paymentMethod: 'demo_card',
      paymentPlan: 'full',
      notes: '',
      saveAddress: false,
      acknowledgeDemo: false,
    },
  });

  // Prefill from the signed-in customer's profile and default address.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listAddresses(user.id)
      .catch(() => [])
      .then((addresses) => {
        if (cancelled) return;
        const a = addresses.find((x) => x.isDefault) ?? addresses[0];
        const current = getValues();
        reset({
          ...current,
          email: current.email || user.email || '',
          fullName: current.fullName || a?.fullName || profile?.fullName || '',
          phone: current.phone || a?.phone || profile?.phone || '',
          line1: current.line1 || a?.line1 || '',
          line2: current.line2 || a?.line2 || '',
          city: current.city || a?.city || '',
          state: current.state || a?.state || '',
          postalCode: current.postalCode || a?.postalCode || '',
          country: a?.country || current.country,
          saveAddress: !a,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user, profile, reset, getValues]);

  const shippingMethod = watch('shippingMethod') as ShippingMethodId;
  const paymentMethod = watch('paymentMethod') as PaymentMethodId;
  const paymentPlan = watch('paymentPlan') as PaymentPlanId;
  const totals = computeTotals(subtotal, promoCode, shippingMethod);
  const schedule = installmentSchedule(totals.total);
  const chargeToday = dueToday(totals.total, paymentPlan, paymentMethod);
  const fmt = (n: number) => formatCurrency(n, settings.currency);
  const methodLabel = SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.label;

  if (!isSupabaseConfigured) return <SetupRequired feature="checkout" />;

  if (lines.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" aria-hidden="true" />}
          title="Your cart is empty"
          description="Add something to your cart before checking out."
          action={<Link to="/shop" className="btn-primary">Browse the shop</Link>}
        />
      </div>
    );
  }

  const onSubmit = async (v: CheckoutValues) => {
    setServerError(null);
    if (totals.promo.error) {
      setServerError(totals.promo.error);
      return;
    }
    try {
      const shippingAddress = {
        fullName: v.fullName,
        phone: v.phone,
        line1: v.line1,
        line2: v.line2 || undefined,
        city: v.city,
        state: v.state,
        postalCode: v.postalCode,
        country: v.country,
      };
      const order = await placeOrder({
        email: v.email,
        fullName: v.fullName,
        phone: v.phone,
        shippingAddress,
        shippingMethod: v.shippingMethod,
        paymentMethod: v.paymentMethod,
        paymentPlan: v.paymentPlan,
        promoCode,
        notes: v.notes,
        lines,
      });
      if (user && v.saveAddress) {
        await saveAddress(user.id, { ...shippingAddress, label: 'Home', phone: v.phone, line2: v.line2 || null, isDefault: true }).catch(() => undefined);
      }
      navigate(`/checkout/success/${order.orderNumber}`, {
        replace: true,
        state: {
          total: order.total,
          email: v.email,
          paymentMethod: v.paymentMethod,
          paymentPlan: v.paymentPlan,
          paidToday: dueToday(order.total, v.paymentPlan, v.paymentMethod),
          itemCount: lines.reduce((s, l) => s + l.quantity, 0),
        },
      });
      clearCart();
    } catch (e) {
      setServerError(friendlyError(e));
    }
  };

  return (
    <>
      <PageHeader title="Checkout" crumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <div className="container-page py-10">
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" role="note">
          <strong>Demo checkout:</strong> no real payment is processed and no card details are collected. Submitting creates an order in the
          database with status “paid (demo)” or “pending”.
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <fieldset className="card space-y-4 p-6">
              <legend className="sr-only">Contact information</legend>
              <h2 className="text-lg font-semibold">Contact</h2>
              {!user && (
                <p className="text-sm text-ink-400">
                  Have an account?{' '}
                  <Link to="/login?redirect=/checkout" className="text-nova-300 hover:text-pulse-300">
                    Sign in
                  </Link>{' '}
                  for faster checkout and order history.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" error={errors.email?.message} required>
                  <input type="email" autoComplete="email" className="input" {...register('email')} />
                </Field>
                <Field label="Phone" error={errors.phone?.message} required>
                  <input type="tel" autoComplete="tel" className="input" {...register('phone')} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="card space-y-4 p-6">
              <legend className="sr-only">Shipping address</legend>
              <h2 className="text-lg font-semibold">Shipping address</h2>
              <Field label="Full name" error={errors.fullName?.message} required>
                <input autoComplete="name" className="input" {...register('fullName')} />
              </Field>
              <Field label="Address line 1" error={errors.line1?.message} required>
                <input autoComplete="address-line1" className="input" {...register('line1')} />
              </Field>
              <Field label="Address line 2 (optional)" error={errors.line2?.message}>
                <input autoComplete="address-line2" className="input" {...register('line2')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country" error={errors.country?.message} required>
                  <select autoComplete="country" className="input" {...register('country')}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="State / province / region" error={errors.state?.message} required>
                  <input autoComplete="address-level1" className="input" {...register('state')} />
                </Field>
                <Field label="City" error={errors.city?.message} required>
                  <input autoComplete="address-level2" className="input" {...register('city')} />
                </Field>
                <Field label="Postal code" error={errors.postalCode?.message} required>
                  <input autoComplete="postal-code" className="input" {...register('postalCode')} />
                </Field>
              </div>
              {user && (
                <label className="flex items-center gap-2.5 text-sm text-ink-300">
                  <input type="checkbox" className="h-4 w-4 accent-nova-500" {...register('saveAddress')} />
                  Save this as my default address
                </label>
              )}
            </fieldset>

            <fieldset className="card space-y-3 p-6">
              <legend className="text-lg font-semibold text-white">Shipping method</legend>
              {SHIPPING_METHODS.map((m) => {
                const cost = computeTotals(subtotal, promoCode, m.id).shipping ?? m.price;
                return (
                  <label
                    key={m.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-pulse-400',
                      shippingMethod === m.id ? 'border-nova-400 bg-nova-500/10' : 'border-ink-700 hover:border-ink-500',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input type="radio" value={m.id} className="h-4 w-4 accent-nova-500" {...register('shippingMethod')} />
                      <span>
                        <span className="block text-sm font-semibold text-white">{m.label}</span>
                        <span className="block text-xs text-ink-400">{m.eta}</span>
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-white">{cost === 0 ? 'Free' : formatCurrency(cost, settings.currency)}</span>
                  </label>
                );
              })}
            </fieldset>

            <fieldset className="card space-y-3 p-6">
              <legend className="text-lg font-semibold text-white">How would you like to pay?</legend>
              {(
                [
                  { id: 'full', title: 'Complete payment', text: `Pay ${fmt(totals.total)} today.` },
                  {
                    id: 'installments',
                    title: `Pay in ${INSTALLMENT_COUNT} installments`,
                    text: `${fmt(schedule[0].amount)} today, then ${INSTALLMENT_COUNT - 1} payments of about ${fmt(schedule[1].amount)} every 30 days. No extra fees. Ships once paid in full — or complete the balance any time.`,
                  },
                ] as Array<{ id: PaymentPlanId; title: string; text: string }>
              ).map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-pulse-400',
                    paymentPlan === o.id ? 'border-nova-400 bg-nova-500/10' : 'border-ink-700 hover:border-ink-500',
                  )}
                >
                  <input
                    type="radio"
                    value={o.id}
                    disabled={o.id === 'installments' && !user}
                    className="mt-1 h-4 w-4 accent-nova-500"
                    {...register('paymentPlan')}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">{o.title}</span>
                    <span className="block text-xs text-ink-400">{o.text}</span>
                    {o.id === 'installments' && !user && (
                      <Link to="/login?redirect=/checkout" className="mt-1 inline-block text-xs font-semibold text-nova-300 hover:text-pulse-300">
                        Sign in to pay in installments →
                      </Link>
                    )}
                  </span>
                </label>
              ))}
              {paymentPlan === 'installments' && (
                <ol className="space-y-1.5 rounded-xl border border-ink-700 bg-ink-850/60 p-4 text-sm" aria-label="Installment schedule">
                  {schedule.map((i) => (
                    <li key={i.n} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-ink-300">
                        <CalendarClock className="h-4 w-4 text-pulse-400" aria-hidden="true" />
                        {i.n === 1 ? 'Today' : `Payment ${i.n} · by ${formatDate(i.due)}`}
                      </span>
                      <span className="font-semibold text-white">{fmt(i.amount)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </fieldset>

            <fieldset className="card space-y-3 p-6">
              <legend className="text-lg font-semibold text-white">Payment method</legend>
              {PAYMENT_METHODS.map((m) => {
                const Icon = PAYMENT_ICONS[m.id];
                return (
                  <label
                    key={m.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-pulse-400',
                      paymentMethod === m.id ? 'border-nova-400 bg-nova-500/10' : 'border-ink-700 hover:border-ink-500',
                    )}
                  >
                    <input type="radio" value={m.id} className="mt-1 h-4 w-4 accent-nova-500" {...register('paymentMethod')} />
                    <Icon className="mt-0.5 h-5 w-5 text-pulse-400" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-white">{m.label}</span>
                      <span className="block text-xs text-ink-400">{m.description}</span>
                    </span>
                  </label>
                );
              })}
              {paymentMethod === 'demo_card' && (
                <div className="rounded-xl border border-dashed border-ink-600 p-4" aria-describedby="card-demo-note">
                  <div className="grid gap-3 opacity-60 sm:grid-cols-[2fr_1fr_1fr]">
                    <input className="input" disabled value="4242 4242 4242 4242" aria-label="Card number (demo, disabled)" readOnly />
                    <input className="input" disabled value="12 / 30" aria-label="Expiry (demo, disabled)" readOnly />
                    <input className="input" disabled value="•••" aria-label="CVC (demo, disabled)" readOnly />
                  </div>
                  <p id="card-demo-note" className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Card fields are disabled in this demo. Connect a payment provider (e.g. Stripe) before going live.
                  </p>
                </div>
              )}
            </fieldset>

            <div className="card space-y-4 p-6">
              <Field label="Order notes (optional)" error={errors.notes?.message}>
                <textarea className="input min-h-24" {...register('notes')} />
              </Field>
              <div>
                <label className="flex items-start gap-2.5 text-sm text-ink-300">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-nova-500" aria-invalid={errors.acknowledgeDemo ? true : undefined} {...register('acknowledgeDemo')} />
                  <span>
                    I understand this is a demonstration store: no payment will be charged and no products will ship. I agree to the{' '}
                    <Link to="/terms" className="text-nova-300 underline">terms</Link>.
                  </span>
                </label>
                {errors.acknowledgeDemo && <p className="field-error">{errors.acknowledgeDemo.message}</p>}
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
            <div className="card p-5">
              <h2 className="mb-3 text-lg font-semibold">Items ({lines.reduce((s, l) => s + l.quantity, 0)})</h2>
              <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {lines.map((l) => (
                  <li key={`${l.productId}:${l.variantId}`} className="flex items-center gap-3">
                    <span className="relative">
                      <ImageWithFallback src={l.snapshot.image} alt="" className="h-16 w-14 rounded-lg object-cover" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-nova-500 px-1 text-[10px] font-bold text-white">
                        {l.quantity}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm text-white">{l.snapshot.name}</span>
                      {l.snapshot.variantName && <span className="block text-xs text-ink-400">{l.snapshot.variantName}</span>}
                    </span>
                    <span className="text-sm text-white">{formatCurrency(l.snapshot.unitPrice * l.quantity, l.snapshot.currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <OrderSummary totals={totals} currency={settings.currency} shippingLabel={methodLabel}>
              {paymentPlan === 'installments' && (
                <div className="flex justify-between rounded-xl bg-nova-500/10 px-3 py-2 text-sm">
                  <span className="text-ink-200">Due today</span>
                  <span className="font-semibold text-white">{fmt(chargeToday)}</span>
                </div>
              )}
              <FormAlert message={serverError} />
              <button type="submit" className="btn-primary w-full py-3 text-base" disabled={isSubmitting || refreshing}>
                <Lock className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Placing order…' : `Place demo order · ${chargeToday > 0 ? `${fmt(chargeToday)} today` : fmt(totals.total)}`}
              </button>
            </OrderSummary>
          </aside>
        </form>
      </div>
    </>
  );
}
