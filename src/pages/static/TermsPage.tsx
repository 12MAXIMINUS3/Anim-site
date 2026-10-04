import { Link } from 'react-router-dom';
import { LAST_UPDATED, StaticPage } from './StaticPage';

export default function TermsPage() {
  return (
    <StaticPage title="Terms & Conditions" description="The terms that apply when you use the Nova Figure Vault demo storefront." intro={`Last updated ${LAST_UPDATED}`}>
      <p>
        These template terms apply to this demonstration storefront. Replace them with terms reviewed by a qualified professional before
        operating a live store.
      </p>
      <h2>1. Demonstration store</h2>
      <p>
        All products, brands, characters, prices, images and reviews on this site are fictional. Orders placed are recorded for
        demonstration purposes only; no payment is taken and no goods are shipped.
      </p>
      <h2>2. Accounts</h2>
      <p>You are responsible for keeping your login credentials confidential and for activity under your account.</p>
      <h2>3. Pricing & availability</h2>
      <p>Prices and stock levels may change without notice. Totals are calculated and validated at the time the order is created.</p>
      <h2>4. Promo codes</h2>
      <p>Promo codes are limited to one per order, have no cash value and may be withdrawn at any time.</p>
      <h2>5. Preorders</h2>
      <p>Release dates are estimates provided by manufacturers and may change. Preorders may be cancelled before shipment.</p>
      <h2>6. Returns</h2>
      <p>
        See our <Link to="/shipping&returns">Shipping & Returns</Link> policy.
      </p>
      <h2>7. Intellectual property</h2>
      <p>The Nova Figure Vault name, site design and original placeholder artwork belong to the site owner.</p>
      <h2>8. Contact</h2>
      <p>
        Questions about these terms? <Link to="/contact">Contact us</Link>.
      </p>
    </StaticPage>
  );
}
