import { Link } from 'react-router-dom';
import { LAST_UPDATED, StaticPage } from './StaticPage';

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" description="How Figure Haven collects, uses and protects your personal information." intro={`Last updated ${LAST_UPDATED}`}>
      <p>
        This template policy describes how this demonstration store handles personal data. Replace it with a policy reviewed by a qualified
        professional before accepting real orders.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address, phone number and hashed password (managed by Supabase Auth).</li>
        <li><strong>Order data:</strong> shipping address, items purchased and order totals.</li>
        <li><strong>Saved data:</strong> addresses, wishlist and cart contents when you are signed in.</li>
        <li><strong>Device storage:</strong> your guest cart, wishlist, recently viewed items and cookie choice are stored in your browser’s localStorage.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To create and manage your account and orders.</li>
        <li>To send newsletters only if you subscribe — you can unsubscribe at any time.</li>
        <li>To respond to messages sent through the contact form.</li>
      </ul>
      <h2>Payments</h2>
      <p>This demo does not collect or process payment card information.</p>
      <h2>Your rights</h2>
      <p>
        You can view and update your profile and addresses from your account dashboard, and request deletion of your account by{' '}
        <Link to="/contact">contacting us</Link>.
      </p>
      <h2>Cookies & storage</h2>
      <p>We use only essential browser storage required for the cart, wishlist and sign-in. No third-party analytics are loaded in this demo.</p>
    </StaticPage>
  );
}
