-- ============================================================================
--  Nova Figure Vault — Supabase schema, functions, triggers, RLS and storage
--  Run this whole file once in Supabase Dashboard → SQL Editor, then run
--  supabase/seed.sql. The script is idempotent (safe to re-run).
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  full_description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  franchise text,
  sku text not null unique,
  regular_price numeric(10, 2) not null check (regular_price >= 0),
  sale_price numeric(10, 2) check (sale_price is null or (sale_price >= 0 and sale_price < regular_price)),
  price numeric(10, 2) generated always as (coalesce(sale_price, regular_price)) stored,
  currency text not null default 'USD',
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  badge text check (badge in ('new', 'sale', 'preorder', 'limited', 'sold_out')),
  release_date date,
  scale text,
  material text,
  dimensions text,
  weight text,
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  sales_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  alt text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null unique,
  price numeric(10, 2) check (price is null or price >= 0),
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products (id) on delete cascade,
  quantity integer not null default 0,
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  location text not null default 'Main warehouse',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_unique_line unique nulls not distinct (cart_id, product_id, variant_id)
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wishlists_unique unique (user_id, product_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  shipping_address jsonb not null,
  shipping_method text not null,
  payment_method text not null,
  status text not null default 'pending'
    check (status in ('pending', 'partially_paid', 'paid_demo', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_plan text not null default 'full' check (payment_plan in ('full', 'installments')),
  installment_count integer not null default 1 check (installment_count between 1 and 12),
  amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0),
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  shipping numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  currency text not null default 'USD',
  promo_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path for databases created before installment plans existed.
alter table public.orders add column if not exists payment_plan text not null default 'full';
alter table public.orders add column if not exists installment_count integer not null default 1;
alter table public.orders add column if not exists amount_paid numeric(10, 2) not null default 0;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'partially_paid', 'paid_demo', 'processing', 'shipped', 'delivered', 'cancelled'));
alter table public.orders drop constraint if exists orders_payment_plan_check;
alter table public.orders add constraint orders_payment_plan_check check (payment_plan in ('full', 'installments'));

-- Every payment received against an order (deposit, installment, balance, in-store).
create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  method text not null,
  kind text not null check (kind in ('full', 'deposit', 'installment', 'balance')),
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists order_payments_order_idx on public.order_payments (order_id, created_at);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  image_url text,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists products_franchise_idx on public.products (franchise);
create index if not exists products_price_idx on public.products (price);
create index if not exists products_featured_idx on public.products (featured) where featured;
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists product_images_product_idx on public.product_images (product_id, position);
create index if not exists product_variants_product_idx on public.product_variants (product_id, position);
create index if not exists cart_items_cart_idx on public.cart_items (cart_id);
create index if not exists wishlists_user_idx on public.wishlists (user_id);
create index if not exists addresses_user_idx on public.addresses (user_id);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);
create unique index if not exists reviews_one_per_user_idx on public.reviews (product_id, user_id) where user_id is not null;
create unique index if not exists newsletter_email_idx on public.newsletter_subscribers (lower(email));
create index if not exists categories_position_idx on public.categories (position);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'categories', 'brands', 'products', 'product_images', 'product_variants',
    'inventory', 'carts', 'cart_items', 'wishlists', 'addresses', 'orders', 'order_items',
    'reviews', 'newsletter_subscribers', 'site_settings', 'contact_messages', 'order_payments'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Auth helpers & profile trigger
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Emails that become admins automatically when they sign up.
-- Add one with:  insert into public.admin_invites (email) values ('you@example.com');
create table if not exists public.admin_invites (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_invites enable row level security; -- no policies: only definer functions read it

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when exists (select 1 from public.admin_invites ai where lower(ai.email) = lower(new.email)) then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers may edit their own profile but never their own role.
-- (Role changes from the SQL editor / service role, where auth.uid() is null, are allowed.)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can change user roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ----------------------------------------------------------------------------
-- Inventory & rating triggers
-- ----------------------------------------------------------------------------
-- Mirror products.inventory_quantity into the inventory table (which also holds
-- the low-stock threshold used by the admin dashboard).
create or replace function public.sync_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory (product_id, quantity)
  values (new.id, new.inventory_quantity)
  on conflict (product_id) do update set quantity = excluded.quantity;
  return new;
end;
$$;

drop trigger if exists products_sync_inventory on public.products;
create trigger products_sync_inventory
  after insert or update of inventory_quantity on public.products
  for each row execute function public.sync_inventory();

-- When a product has variants, its total stock is the sum of variant stock.
create or replace function public.sync_variant_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set inventory_quantity = coalesce((select sum(v.inventory_quantity) from public.product_variants v where v.product_id = pid), 0)
   where p.id = pid
     and exists (select 1 from public.product_variants v where v.product_id = pid);
  return null;
end;
$$;

drop trigger if exists product_variants_sync_stock on public.product_variants;
create trigger product_variants_sync_stock
  after insert or update or delete on public.product_variants
  for each row execute function public.sync_variant_stock();

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products
     set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where product_id = pid and is_approved), 0),
         rating_count = (select count(*) from public.reviews where product_id = pid and is_approved)
   where id = pid;
  return null;
end;
$$;

drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ----------------------------------------------------------------------------
-- RPC: catalog facets (public)
-- ----------------------------------------------------------------------------
create or replace function public.get_catalog_facets()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'franchises', coalesce((select jsonb_agg(distinct franchise order by franchise) from products where status = 'active' and franchise is not null), '[]'::jsonb),
    'scales', coalesce((select jsonb_agg(distinct scale order by scale) from products where status = 'active' and scale is not null), '[]'::jsonb),
    'min_price', coalesce((select min(price) from products where status = 'active'), 0),
    'max_price', coalesce((select max(price) from products where status = 'active'), 0)
  );
$$;

-- ----------------------------------------------------------------------------
-- RPC: create_order (DEMO checkout — no real payment is processed)
-- Prices, discounts, shipping and stock are calculated server-side so the
-- client cannot tamper with totals. Works for guests and signed-in users.
-- ----------------------------------------------------------------------------
-- ----------------------------------------------------------------------------
-- Payments & installment plans (DEMO — no real money moves)
--   Installments: any order can be paid in 4 equal payments
--   (25% deposit at checkout + 3 more). Mirrored in src/lib/pricing.ts.
-- ----------------------------------------------------------------------------
create or replace function public._installment_amount(p_total numeric, p_paid numeric, p_count integer)
returns numeric
language sql
immutable
as $$
  -- Equal share of the total, capped at what is still owed. If paying one share
  -- would leave less than a cent, the payment covers the whole remainder.
  select case
    when (p_total - p_paid) - round(p_total / greatest(p_count, 1), 2) < 0.01 then p_total - p_paid
    else round(p_total / greatest(p_count, 1), 2)
  end;
$$;

-- Records a payment and moves the order between pending / partially paid / paid.
create or replace function public._apply_order_payment(
  p_order_id uuid, p_amount numeric, p_method text, p_kind text, p_note text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_paid numeric(10, 2);
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status = 'cancelled' then
    raise exception 'This order was cancelled';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;
  if p_amount > v_order.total - v_order.amount_paid + 0.001 then
    raise exception 'Payment of % is more than the balance due (%)', p_amount, v_order.total - v_order.amount_paid;
  end if;

  insert into public.order_payments (order_id, amount, method, kind, note, recorded_by)
  values (p_order_id, round(p_amount, 2), p_method, p_kind, nullif(trim(coalesce(p_note, '')), ''), auth.uid());

  v_paid := v_order.amount_paid + round(p_amount, 2);
  update public.orders
     set amount_paid = v_paid,
         status = case
           when status in ('pending', 'partially_paid') and v_paid >= total then 'paid_demo'
           when status = 'pending' and v_paid < total then 'partially_paid'
           else status
         end
   where id = p_order_id;
  return v_order.total - v_paid;
end;
$$;
revoke all on function public._apply_order_payment(uuid, numeric, text, text, text) from public, anon, authenticated;

-- Older 9-argument version (before payment plans) — removed so the RPC is unambiguous.
drop function if exists public.create_order(text, text, text, jsonb, text, text, jsonb, text, text);

create or replace function public.create_order(
  p_email text,
  p_full_name text,
  p_phone text,
  p_shipping_address jsonb,
  p_shipping_method text,
  p_payment_method text,
  p_items jsonb,
  p_promo_code text default null,
  p_notes text default null,
  p_payment_plan text default 'full'
)
returns table (order_id uuid, order_number text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_has_variants boolean;
  v_qty integer;
  v_unit numeric(10, 2);
  v_variant_name text;
  v_sku text;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_shipping numeric(10, 2) := 0;
  v_tax numeric(10, 2) := 0;
  v_total numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
  v_code text := nullif(upper(trim(coalesce(p_promo_code, ''))), '');
  v_status text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many items in one order';
  end if;
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email address is required';
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'Full name is required';
  end if;
  if p_shipping_method not in ('standard', 'express', 'overnight') then
    raise exception 'Unknown shipping method';
  end if;
  if p_payment_method not in ('demo_card', 'demo_wallet', 'bank_transfer') then
    raise exception 'Unknown payment method';
  end if;
  if coalesce(p_payment_plan, 'full') not in ('full', 'installments') then
    raise exception 'Unknown payment plan';
  end if;
  if p_payment_plan = 'installments' and auth.uid() is null then
    raise exception 'Please sign in to pay in installments, so you can make the remaining payments from your account';
  end if;

  -- Status is settled by _apply_order_payment once totals are known.
  v_status := 'pending';
  v_order_number := 'NFV-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  insert into public.orders (
    order_number, user_id, email, full_name, phone, shipping_address,
    shipping_method, payment_method, status, currency, promo_code, notes, payment_plan, installment_count
  )
  values (
    v_order_number, auth.uid(), lower(trim(p_email)), trim(p_full_name), nullif(trim(coalesce(p_phone, '')), ''),
    p_shipping_address, p_shipping_method, p_payment_method, v_status, 'USD', v_code, nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_payment_plan, 'full'), case when p_payment_plan = 'installments' then 4 else 1 end
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'Invalid quantity in cart';
    end if;

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid and status = 'active'
     for update;
    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;

    select exists (select 1 from public.product_variants where product_id = v_product.id) into v_has_variants;
    v_unit := v_product.price;
    v_variant_name := null;
    v_sku := v_product.sku;

    if v_has_variants then
      if coalesce(v_item ->> 'variant_id', '') = '' then
        raise exception 'Please choose an edition for %', v_product.name;
      end if;
      select * into v_variant
        from public.product_variants
       where id = (v_item ->> 'variant_id')::uuid and product_id = v_product.id
       for update;
      if not found then
        raise exception 'The selected edition of % is no longer available', v_product.name;
      end if;
      if v_variant.inventory_quantity < v_qty then
        raise exception 'Only % left of % (%)', v_variant.inventory_quantity, v_product.name, v_variant.name;
      end if;
      v_unit := coalesce(v_variant.price, v_product.price);
      v_variant_name := v_variant.name;
      v_sku := v_variant.sku;
      -- Variant trigger recalculates the parent product's total stock.
      update public.product_variants set inventory_quantity = inventory_quantity - v_qty where id = v_variant.id;
    else
      if v_product.inventory_quantity < v_qty then
        raise exception 'Only % left of %', v_product.inventory_quantity, v_product.name;
      end if;
      update public.products set inventory_quantity = inventory_quantity - v_qty where id = v_product.id;
    end if;

    update public.products set sales_count = sales_count + v_qty where id = v_product.id;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_name, sku, image_url, unit_price, quantity, line_total
    )
    values (
      v_order_id, v_product.id, case when v_has_variants then v_variant.id else null end,
      v_product.name, v_variant_name, v_sku,
      (select url from public.product_images where product_id = v_product.id order by position limit 1),
      v_unit, v_qty, v_unit * v_qty
    );

    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  -- Demo promo codes (mirrored in src/lib/pricing.ts)
  if v_code = 'WELCOME10' then
    v_discount := round(v_subtotal * 0.10, 2);
  elsif v_code = 'VAULT15' then
    if v_subtotal < 150 then
      raise exception 'VAULT15 applies to orders of $150 or more';
    end if;
    v_discount := round(v_subtotal * 0.15, 2);
  elsif v_code is not null then
    raise exception 'Promo code % is not valid', v_code;
  end if;

  -- Demo shipping rates (mirrored in src/lib/pricing.ts)
  v_shipping := case p_shipping_method
    when 'standard' then case when v_subtotal - v_discount >= 200 then 0 else 9.95 end
    when 'express' then 24.95
    when 'overnight' then 39.95
  end;

  -- Tax is a placeholder (0%) in this demo store.
  v_tax := 0;
  v_total := v_subtotal - v_discount + v_shipping + v_tax;

  update public.orders
     set subtotal = v_subtotal, discount = v_discount, shipping = v_shipping, tax = v_tax, total = v_total
   where id = v_order_id;

  -- Payment at checkout (demo). Bank transfers stay pending until the admin records the payment.
  if p_payment_plan = 'installments' then
    if p_payment_method <> 'bank_transfer' then
      perform public._apply_order_payment(v_order_id, public._installment_amount(v_total, 0, 4), p_payment_method, 'deposit');
    end if;
  elsif p_payment_method <> 'bank_transfer' then
    perform public._apply_order_payment(v_order_id, v_total, p_payment_method, 'full');
  end if;

  return query select v_order_id, v_order_number, v_total;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: customer pays the next installment or the full remaining balance (demo).
-- The amount is calculated here, never trusted from the browser.
-- ----------------------------------------------------------------------------
create or replace function public.pay_order_balance(p_order_id uuid, p_kind text, p_method text default 'demo_card')
returns table (amount_paid numeric, balance numeric, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_order public.orders%rowtype;
  v_amount numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'Please sign in to make a payment';
  end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found or v_order.user_id is distinct from auth.uid() then
    raise exception 'Order not found';
  end if;
  if p_kind not in ('installment', 'balance') then
    raise exception 'Unknown payment type';
  end if;
  if p_method not in ('demo_card', 'demo_wallet') then
    raise exception 'Unknown payment method';
  end if;
  if v_order.total - v_order.amount_paid <= 0 then
    raise exception 'This order is already paid in full';
  end if;

  v_amount := case
    when p_kind = 'balance' then v_order.total - v_order.amount_paid
    else public._installment_amount(v_order.total, v_order.amount_paid, v_order.installment_count)
  end;
  perform public._apply_order_payment(p_order_id, v_amount, p_method, p_kind);

  return query select o.amount_paid, o.total - o.amount_paid, o.status from public.orders o where o.id = p_order_id;
end;
$$;

-- In-person payments are not offered; remove the function if an earlier version created it.
drop function if exists public.admin_record_payment(uuid, numeric, text, text);

-- ----------------------------------------------------------------------------
-- RPC: admin dashboard stats
-- ----------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  return jsonb_build_object(
    'total_products', (select count(*) from products),
    'active_products', (select count(*) from products where status = 'active'),
    'low_stock', (select count(*) from inventory i join products p on p.id = i.product_id
                   where p.status = 'active' and i.quantity <= i.low_stock_threshold),
    'pending_orders', (select count(*) from orders where status in ('pending', 'partially_paid', 'paid_demo', 'processing')),
    'outstanding_balance', coalesce((select sum(total - amount_paid) from orders where status <> 'cancelled' and total > amount_paid), 0),
    'total_customers', (select count(*) from profiles where role = 'customer'),
    'revenue_demo', coalesce((select sum(amount_paid) from orders where status <> 'cancelled'), 0)
  );
end;
$$;

create or replace function public.admin_low_stock(p_limit integer default 10)
returns table (product_id uuid, name text, sku text, quantity integer, low_stock_threshold integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  return query
    select p.id, p.name, p.sku, i.quantity, i.low_stock_threshold
      from inventory i join products p on p.id = i.product_id
     where p.status = 'active' and i.quantity <= i.low_stock_threshold
     order by i.quantity asc, p.name
     limit p_limit;
end;
$$;

grant execute on function public.get_catalog_facets() to anon, authenticated;
grant execute on function public.create_order(text, text, text, jsonb, text, text, jsonb, text, text, text) to anon, authenticated;
grant execute on function public.pay_order_balance(uuid, text, text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_low_stock(integer) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_payments enable row level security;
alter table public.reviews enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

-- Drop existing policies so the script can be re-run.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
     where schemaname = 'public'
       and tablename in (
         'profiles', 'categories', 'brands', 'products', 'product_images', 'product_variants', 'inventory',
         'carts', 'cart_items', 'wishlists', 'addresses', 'orders', 'order_items', 'order_payments', 'reviews',
         'newsletter_subscribers', 'site_settings', 'contact_messages'
       )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end;
$$;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- catalog: public read of published data, admin-only writes
create policy "categories_public_read" on public.categories
  for select using (is_active or public.is_admin());
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "brands_public_read" on public.brands
  for select using (true);
create policy "brands_admin_write" on public.brands
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_public_read" on public.products
  for select using (status = 'active' or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_images_public_read" on public.product_images
  for select using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_variants_public_read" on public.product_variants
  for select using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );
create policy "product_variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "inventory_admin_all" on public.inventory
  for all using (public.is_admin()) with check (public.is_admin());

-- carts / cart items: owner only
create policy "carts_owner_all" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cart_items_owner_all" on public.cart_items
  for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

-- wishlists / addresses: owner only
create policy "wishlists_owner_all" on public.wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "addresses_owner_all" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: owner read; creation only through create_order(); admin manages
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_delete" on public.orders
  for delete using (public.is_admin());

create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
-- order payments: owner and admin can read; writes only via security-definer RPCs
create policy "order_payments_select_own_or_admin" on public.order_payments
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "order_items_admin_write" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- reviews
create policy "reviews_public_read" on public.reviews
  for select using (is_approved or user_id = auth.uid() or public.is_admin());
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "reviews_update_own_or_admin" on public.reviews
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- newsletter / contact: anyone can submit, only admins can read
create policy "newsletter_public_insert" on public.newsletter_subscribers
  for insert with check (true);
create policy "newsletter_admin_read" on public.newsletter_subscribers
  for select using (public.is_admin());
create policy "newsletter_admin_delete" on public.newsletter_subscribers
  for delete using (public.is_admin());

create policy "contact_public_insert" on public.contact_messages
  for insert with check (true);
create policy "contact_admin_read" on public.contact_messages
  for select using (public.is_admin());

-- site settings: public read, admin write
create policy "site_settings_public_read" on public.site_settings
  for select using (true);
create policy "site_settings_admin_write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Storage: product-images bucket
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_bucket_public_read" on storage.objects;
drop policy if exists "product_images_bucket_admin_insert" on storage.objects;
drop policy if exists "product_images_bucket_admin_update" on storage.objects;
drop policy if exists "product_images_bucket_admin_delete" on storage.objects;

create policy "product_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_bucket_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Storage: site-images bucket (hero, categories, community gallery, home video)
-- Managed from Admin → Site images. Public read, admin-only writes.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images', 'site-images', true, 52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_images_bucket_public_read" on storage.objects;
drop policy if exists "site_images_bucket_admin_insert" on storage.objects;
drop policy if exists "site_images_bucket_admin_update" on storage.objects;
drop policy if exists "site_images_bucket_admin_delete" on storage.objects;

create policy "site_images_bucket_public_read" on storage.objects
  for select using (bucket_id = 'site-images');
create policy "site_images_bucket_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-images' and public.is_admin());
create policy "site_images_bucket_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'site-images' and public.is_admin());
create policy "site_images_bucket_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-images' and public.is_admin());

-- ----------------------------------------------------------------------------
-- Make yourself an admin (run after registering through the site):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ----------------------------------------------------------------------------
