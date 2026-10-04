import { Link } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import { SHIPPING_METHODS, FREE_SHIPPING_THRESHOLD } from '@/lib/pricing';
import { formatCurrency } from '@/lib/format';
import { LAST_UPDATED, StaticPage } from './StaticPage';

export default function ShippingReturnsPage() {
  const { settings } = useSettings();
  return (
    <StaticPage title="Shipping & Returns" description="Shipping rates, delivery times, preorder handling and our 30-day return policy." intro={`Last updated ${LAST_UPDATED}`}>
      <h2>Shipping</h2>
      <p>{settings.shippingMessage}</p>
      <div className="not-prose overflow-x-auto">
        <table className="table-admin mt-4">
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Estimated delivery</th>
              <th scope="col">Cost</th>
            </tr>
          </thead>
          <tbody>
            {SHIPPING_METHODS.map((m) => (
              <tr key={m.id}>
                <td className="text-white">{m.label}</td>
                <td>{m.eta}</td>
                <td>
                  {formatCurrency(m.price)}
                  {m.id === 'standard' && ` (free over ${formatCurrency(FREE_SHIPPING_THRESHOLD)})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Preorders</h3>
      <p>
        Preorder items ship as soon as they arrive at our warehouse. If your order contains both in-stock and preorder items, we ship
        everything together unless you contact us to split the shipment.
      </p>
      <h3>International orders</h3>
      <p>Import duties and taxes may be charged by your country’s customs office and are the responsibility of the recipient.</p>
      <h2>Returns</h2>
      <ul>
        <li>Unopened items can be returned within 30 days of delivery for a full refund.</li>
        <li>Opened items in like-new condition with all parts and packaging can be returned for store credit.</li>
        <li>Limited editions and numbered pieces are final sale unless they arrive damaged.</li>
      </ul>
      <h3>Damaged or defective items</h3>
      <p>
        Email photos of the item and its packaging within 7 days of delivery. We’ll arrange a replacement, a part swap or a refund — your
        choice.
      </p>
      <p>
        Start a return from the <Link to="/contact">contact page</Link> with your order number.
      </p>
    </StaticPage>
  );
}
