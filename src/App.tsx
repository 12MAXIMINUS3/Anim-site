import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from '@/components/ui/Toaster';
import { Spinner } from '@/components/ui/States';
import { GuestOnly, RequireAdmin, RequireAuth } from '@/routes/guards';
import { useCommerceSync } from '@/hooks/useCommerceSync';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const AboutPage = lazy(() => import('@/pages/static/AboutPage'));
const ContactPage = lazy(() => import('@/pages/static/ContactPage'));
const FaqPage = lazy(() => import('@/pages/static/FaqPage'));
const ShippingReturnsPage = lazy(() => import('@/pages/static/ShippingReturnsPage'));
const PrivacyPage = lazy(() => import('@/pages/static/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/static/TermsPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminProductEditor = lazy(() => import('@/pages/admin/AdminProductEditor'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminBrands = lazy(() => import('@/pages/admin/AdminBrands'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

export default function App() {
  useCommerceSync();

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/page/:page" element={<ShopPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/success/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="shipping&returns" element={<ShippingReturnsPage />} />
          <Route path="shipping-returns" element={<Navigate to="/shipping&returns" replace />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Suspense fallback={<Spinner className="py-32" />}>
                <AdminLayout />
              </Suspense>
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductEditor />} />
          <Route path="products/:id/edit" element={<AdminProductEditor />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
