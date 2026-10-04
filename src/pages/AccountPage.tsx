import { useSearchParams } from 'react-router-dom';
import { Heart, MapPin, Package, Settings, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSeo } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProfileForm } from '@/components/account/ProfileForm';
import { AddressBook } from '@/components/account/AddressBook';
import { OrderHistory } from '@/components/account/OrderHistory';
import { AccountSettings } from '@/components/account/AccountSettings';
import { WishlistGrid } from './WishlistPage';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function AccountPage() {
  useSeo({ title: 'My account', noIndex: true });
  const { profile, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'profile') as TabId;

  return (
    <>
      <PageHeader title={`Hi, ${profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'collector'}`} crumbs={[{ label: 'Account' }]} description="Manage your profile, orders, addresses and wishlist." />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account sections">
          <ul className="scrollbar-none flex gap-2 overflow-x-auto lg:flex-col">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  aria-current={tab === id ? 'page' : undefined}
                  onClick={() => setParams(id === 'profile' ? {} : { tab: id })}
                  className={cn(
                    'flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition',
                    tab === id ? 'bg-nova-500/15 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section aria-label={TABS.find((t) => t.id === tab)?.label}>
          {tab === 'profile' && <ProfileForm />}
          {tab === 'orders' && <OrderHistory />}
          {tab === 'addresses' && <AddressBook />}
          {tab === 'wishlist' && <WishlistGrid />}
          {tab === 'settings' && <AccountSettings />}
        </section>
      </div>
    </>
  );
}
