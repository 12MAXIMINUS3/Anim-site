# Nova Figure Vault

A dark, premium storefront for collectible figures. It is built with **React 18 + Vite + TypeScript**, **Tailwind CSS**, **React Router**, **Supabase** (Postgres, Auth and Storage), **Zustand**, **React Hook Form + Zod** and **Lucide** icons.

> All brands, characters, products, prices, reviews and artwork in this repository are **original and fictional**. Checkout is a **demo**: it never collects card details or charges anyone. It creates orders with the status `paid_demo` or `pending`.

---

## 1. Architecture overview

```
Browser (React SPA, Vite)
 ├─ Routing ............ React Router, lazy-loaded pages, auth/admin route guards
 ├─ Global state ....... Zustand: cart, wishlist, recently viewed, UI, toasts (localStorage-persisted)
 │                       React Context: auth session/profile, site settings
 ├─ Services layer ..... src/services/* — the only code that talks to Supabase
 │    ├─ catalog.ts → supabaseCatalog.ts  (live)   or  localCatalog.ts (preview mode)
 │    ├─ orders.ts  → RPC create_order()  (server-side price/stock/promo validation)
 │    ├─ remoteCommerce.ts (cart + wishlist sync), account.ts, admin.ts, engagement.ts
 └─ UI ................. components/{ui,layout,product,home,account,admin}, pages/*

Supabase
 ├─ Postgres: 17 tables, RLS on every table, triggers (profiles, updated_at,
 │   inventory mirror, variant stock roll-up, review ratings), RPCs
 ├─ Auth: email/password, password reset
 └─ Storage: public `product-images` bucket (admin-only writes)
```

Key design decisions:

* **The server owns the totals.** `create_order()` is a `SECURITY DEFINER` Postgres function. It re-reads prices, validates stock, applies the promo codes, calculates shipping, decrements inventory and writes the order and its items in one transaction. The client only previews totals (`src/lib/pricing.ts` mirrors the same rules).
* **Guest-first cart.** Guests' carts and wishlists live in `localStorage`. When a user signs in, `useCommerceSync` merges the local data with the Supabase copy and then keeps both in sync (debounced). Signing out clears the copy on the device.
* **Preview mode.** If no Supabase env vars are set, the catalog falls back to `src/data/seedProducts.ts`, so you can browse the store right away. Features that need a backend show a "Connect Supabase" screen instead of pretending to work.
* **Single source of seed data.** `src/data/seedProducts.ts` feeds the preview catalog, and `npm run seed:generate` turns it into `supabase/seed.sql` plus the placeholder SVG artwork.

## 2. Folder tree

```
.
├─ index.html, vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig.json
├─ vercel.json                 SPA rewrites + asset caching
├─ .env.example
├─ scripts/build-seed.ts       generates supabase/seed.sql + public/images/**
├─ supabase/
│  ├─ schema.sql               tables, indexes, triggers, RPCs, RLS, storage bucket
│  └─ seed.sql                 generated demo data (8 categories, 7 brands, 38 products)
├─ public/
│  ├─ favicon.svg
│  └─ images/{products,categories,hero,community}/*.svg   original placeholder art
└─ src/
   ├─ main.tsx, App.tsx, index.css, vite-env.d.ts
   ├─ types/index.ts
   ├─ data/seedProducts.ts     ← replace with your own inventory
   ├─ lib/        supabase, pricing, format, seo, product, schemas, countries, catalogParams, storage, authErrors, cn
   ├─ services/   catalog, supabaseCatalog, localCatalog, catalogTypes, mappers, orders, account, remoteCommerce, engagement, admin
   ├─ store/      cartStore, wishlistStore, recentlyViewedStore, uiStore, toastStore
   ├─ context/    AuthContext, SettingsContext
   ├─ hooks/      useAsync, useDebounce, useFocusTrap, useCommerceSync, useCartRefresh, useShopActions
   ├─ routes/     guards.tsx (RequireAuth, RequireAdmin, GuestOnly)
   ├─ components/
   │  ├─ ui/        Dialog, Accordion, Pagination, Price, Rating, Badge, QuantitySelector, ImageWithFallback, FormField, States, Toaster, SetupRequired
   │  ├─ layout/    Layout, Header, SearchBox, AccountMenu, MobileNav, AnnouncementBar, Footer, NewsletterForm, CookieConsent, Logo, PageHeader
   │  ├─ product/   ProductCard, ProductGrid, ProductRail, QuickViewModal, ProductGallery, VariantSelector, CatalogView, FilterPanel, CartDrawer, CartLineItem, OrderSummary, ReviewsSection
   │  ├─ home/      HomeSections (hero, categories, promo split, benefits, newsletter, community strip)
   │  ├─ account/   ProfileForm, AddressBook, OrderHistory, OrderDetails, AccountSettings
   │  └─ admin/     ProductImagesManager, TaxonomyManager
   └─ pages/
      ├─ HomePage, ShopPage, CategoryPage, SearchPage, ProductPage, WishlistPage, CartPage, CheckoutPage, OrderSuccessPage, AccountPage, NotFoundPage
      ├─ auth/    LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
      ├─ static/  About, Contact, FAQ, ShippingReturns, Privacy, Terms
      └─ admin/   AdminLayout, Dashboard, Products, ProductEditor, Categories, Brands, Orders, Customers, Settings
```

### Routes

| Public | Account / auth | Admin (role = `admin`) |
|---|---|---|
| `/`, `/shop`, `/shop/page/:page`, `/category/:slug`, `/product/:slug`, `/search?q=`, `/wishlist`, `/cart`, `/checkout`, `/checkout/success/:orderNumber`, `/about`, `/contact`, `/faq`, `/shipping&returns` (alias `/shipping-returns`), `/privacy`, `/terms`, `*` (404) | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account?tab=profile\|orders\|addresses\|wishlist\|settings` | `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/categories`, `/admin/brands`, `/admin/orders`, `/admin/customers`, `/admin/settings` |

Shop filters are stored in the URL, for example `/shop/page/2?category=statues&brand=lumen-forge&min=50&max=300&availability=in_stock&preorder=exclude&sale=1&scale=1/7&sort=price_asc`.

## 3. Dependencies

Runtime: `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`.
Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `@types/*`, `tsx` (runs the seed generator).

```bash
npm install
```

Requires Node.js 18.18+ (tested on Node 24).

## 4. Local setup, step by step

### A. Quick look (no backend)

```bash
npm install
npm run dev          # http://localhost:5173
```

This runs in **preview mode**. You can browse the catalog, filters, product pages, cart and wishlist using local data. Accounts, checkout, reviews, newsletter and admin show a setup notice.

### B. Connect Supabase

1. Create a project at <https://supabase.com> (any region, free tier is fine).
2. **Dashboard → SQL Editor → New query.** Paste all of `supabase/schema.sql` and click **Run**.
3. Open another query, paste all of `supabase/seed.sql` and click **Run**.
4. **Project Settings → API.** Copy the *Project URL* and the *anon public* key.
5. Create the env file:
   ```bash
   cp .env.example .env.local
   ```
   Then fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_SITE_URL=http://localhost:5173`.
6. **Authentication → URL Configuration.**
   * Site URL: `http://localhost:5173` (your production URL later).
   * Redirect URLs: add `http://localhost:5173/reset-password` and `http://localhost:5173/account`. Add the production equivalents when you deploy.
   * Optional for local testing: under **Authentication → Providers → Email**, turn off "Confirm email" so new sign-ups are logged in immediately.
7. Restart `npm run dev`.

### C. Create your first admin

Register through `/register`, then run this in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Sign out and back in (or reload), then open `/admin`. After that, admins can promote other users from **Admin → Customers**.

### D. Build and deploy (Vercel)

```bash
npm run build        # type-checks, then builds to dist/
npm run preview      # serves the production build locally
```

On Vercel, import the repo. The framework preset (Vite), `npm run build` and the `dist` output directory are picked up from `vercel.json`. Add the three `VITE_*` environment variables, and add the production URLs to Supabase's redirect list. `vercel.json` rewrites every path to `index.html`, so deep links such as `/product/...` and `/shipping&returns` work.

## 5. Replacing the demo products with your own

* **Through the admin UI (recommended):** use `/admin/products` to edit, upload real images (stored in the `product-images` bucket, with metadata and alt text in `product_images`), and delete or archive the demo items.
* **In bulk:** edit `src/data/seedProducts.ts`, run `npm run seed:generate`, and re-run `supabase/seed.sql`. The seed upserts by slug or SKU and replaces the seeded images and reviews.
* Only use images and descriptions you have the rights to.

## 6. Demo rules

| Rule | Where |
|---|---|
| `WELCOME10`: 10% off | `create_order()` + `src/lib/pricing.ts` |
| `VAULT15`: 15% off orders of $150 or more | same |
| Shipping: Standard $9.95 (free from $200 after discount), Express $24.95, Overnight $39.95 | same |
| Tax: placeholder 0% | same |
| Payment `demo_card` / `demo_wallet` → status `paid_demo`; `bank_transfer` → `pending` | `create_order()` |

To take real payments, replace the demo payment step with a provider such as Stripe Checkout. Mark orders paid from a server-side webhook, never from the browser.

## 7. Testing checklist

**Storefront**
- [ ] Home loads every section: hero CTAs (Explore Collections scrolls to the categories), new-arrivals carousel arrows, featured, promo, benefits, best sellers, newsletter, community strip.
- [ ] `/shop`: each filter updates the URL and the results. Reloading keeps the filters. Mobile filter drawer works. Sorting covers all 6 options. The 2/3/4 grid toggle works on desktop. `/shop/page/2` paginates.
- [ ] `/category/statues` shows only statues. `/category/nope` shows a 404 state.
- [ ] Header search: typing 2+ characters shows debounced suggestions, arrow keys and Enter navigate, and "See all" opens `/search?q=`.
- [ ] Product card: hover swaps to the second image, the wishlist heart toggles and the header counter updates, quick view opens and closes with Esc, and quick add opens the cart drawer.
- [ ] Product page: thumbnails, hover zoom and lightbox (arrow keys); edition selector changes the price and SKU; quantity is capped by stock; Buy now goes to checkout; accordions; reviews; related products; recently viewed (after you visit 2+ products); JSON-LD `Product` appears in `<head>`.
- [ ] Sold-out products cannot be added. Preorder products show the expected release month.

**Cart & checkout (Supabase connected)**
- [ ] The guest cart survives a page reload. Quantity changes and removals work.
- [ ] `WELCOME10` gives 10% off. `VAULT15` below $150 shows an error; at $150 or more it gives 15% off. Shipping is free on standard above $200.
- [ ] Checkout validation messages appear. Submitting creates an order, shows `/checkout/success/NFV-…`, empties the cart, and stock goes down in the admin.
- [ ] Ordering more than the available stock returns a friendly server error.

**Accounts**
- [ ] Register, log in, log out. Wrong password shows a friendly message.
- [ ] Forgot password sends an email. The link opens `/reset-password`, and you can set a new password.
- [ ] Guest cart and wishlist merge into the account on login and appear on another browser after login.
- [ ] Dashboard: edit the profile, add/edit/delete addresses and set a default, see order history, wishlist, change the password, toggle marketing preference.
- [ ] RLS: user A cannot see user B's orders, addresses, cart or wishlist (check with two accounts).

**Admin**
- [ ] A non-admin visiting `/admin` sees "Admins only". A signed-out visitor is redirected to login.
- [ ] Dashboard cards, recent orders and the low-stock list load.
- [ ] Create a product, then upload images, edit alt text, reorder and delete them; add variants. The product appears on the storefront once it is set to Active.
- [ ] Inline stock edit on the products table. Category and brand CRUD. Order status changes. Role change on customers.
- [ ] Settings: change the announcement message and see the bar update on the storefront.

**Quality**
- [ ] Keyboard only: skip link, menus, dialogs (focus trap and Esc), filters and forms are all usable.
- [ ] No horizontal scroll at 360–390px width. Lighthouse accessibility and SEO checks pass.
